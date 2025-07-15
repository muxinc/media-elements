const EMBED_BASE = 'https://www.tiktok.com/player/v1';

function createPublicPromise() {
  let res, rej;
  const p = new Promise((r, j) => {
    res = r;
    rej = j;
  });
  p.resolve = res;
  p.reject = rej;
  return p;
}

function boolToBinary(props) {
  return Object.entries(props).reduce((acc, [key, val]) => {
    if (val === true || val === '') acc[key] = 1;
    else if (val === false) acc[key] = 0;
    else if (val != null) acc[key] = val;
    return acc;
  }, {});
}

function serialize(props) {
  return String(new URLSearchParams(boolToBinary(props)));
}

function serializeAttributes(attrs) {
  let html = '';
  for (const key in attrs) {
    const value = attrs[key];
    if (value === '') html += ` ${escapeHtml(key)}`;
    else html += ` ${escapeHtml(key)}="${escapeHtml(`${value}`)}"`;
  }
  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/`/g, '&#x60;');
}

function serializeIframeUrl(attrs, props = {}) {
  if (!attrs.src) return;

  const config = JSON.parse(attrs.config || '{}');

  const params = {
    controls: attrs.controls !== 'false' && attrs.controls !== undefined ? 1 : 0,
    autoplay: attrs.autoplay,
    muted: attrs.muted ? 1 : undefined,
    loop: attrs.loop,
    rel: 0,
    ...config,
  };

  const id = attrs.src;
  return `${EMBED_BASE}/${id}?${serialize(params)}`;
}

function getTemplateHTML(attrs, props = {}) {
  const iframeAttrs = {
    src: serializeIframeUrl(attrs, props),
    frameborder: 0,
    width: '100%',
    height: '100%',
    allow: 'accelerometer; autoplay; fullscreen; encrypted-media; gyroscope; picture-in-picture',
  };

  if (props.config) {
    // Serialize Vimeo config on iframe so it can be quickly accessed on first load.
    // Required for React SSR because the custom element is initialized long before React client render.
    iframeAttrs['data-config'] = JSON.stringify(props.config);
  }

  return /*html*/ `
    <style>
      :host { display:inline-block;position:relative;width:100%;height:100%; }
      iframe { position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
    </style>
    <iframe ${serializeAttributes(iframeAttrs)} title="TikTok video"></iframe>
  `;
}

class TikTokVideoElement extends (globalThis.HTMLElement ?? class {}) {
  static getTemplateHTML = getTemplateHTML;
  static shadowRootOptions = { mode: 'open' };
  static PlayerState = { INIT: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 };

  #_muted = false;
  #_loadComplete = createPublicPromise();
  #_loadRequested = null;
  #_currentTime = 0;
  #_paused = true;
  #_playerState = TikTokVideoElement.PlayerState.INIT;
  #_config = {};
  #_volume = 100;
  #_duration = 0;
  #_onMessage = null;

  static get observedAttributes() {
    return ['src', 'controls', 'loop', 'autoplay', 'muted', 'config'];
  }

  constructor() {
    super();
    this.#_upgradeProperty?.('config');
    this.#_onMessage = this.#_handleMessage.bind(this); // ✅ Bind early
  }

  async load() {
    if (this.#_loadRequested) return;

    await (this.#_loadRequested = Promise.resolve());
    this.#_loadComplete = createPublicPromise();
    this.#_currentTime = 0;
    this.#_muted = false;
    this.#_paused = true;
    this.#_playerState = TikTokVideoElement.PlayerState.INIT;

    this.#_config = {};

    if (!this.src) return;

    if (!this.shadowRoot) {
      this.attachShadow(TikTokVideoElement.shadowRootOptions);
    }

    const id = await this.#_resolveVideoId();
    if (!id) {
      console.warn('Could not resolve TikTok video ID');
      return;
    }

    const attrs = { ...this.#attrs, src: id, muted: this.hasAttribute('muted') };

    this.shadowRoot.innerHTML = getTemplateHTML(attrs, this);
    this.iframe = this.shadowRoot.querySelector('iframe');
  }

  connectedCallback() {
    window.addEventListener('message', this.#_onMessage);
    // Support config attribute as fallback
    const configAttr = this.getAttribute('config');
    if (configAttr) {
      try {
        this.#_config = JSON.parse(configAttr);
      } catch (e) {
        console.warn('Invalid config attribute JSON:', configAttr);
      }
    }
    queueMicrotask(() => {
      if (this.src) this.load();
    });
  }

  disconnectedCallback() {
    window.removeEventListener('message', this.#_onMessage);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'muted') {
      newValue != null && newValue !== 'false' ? this.mute() : this.unMute();
    } else if (name === 'config') {
      try {
        this.#_config = JSON.parse(newValue);
      } catch (e) {
        console.warn('Invalid JSON in config attribute:', newValue);
      }
    } else {
      this.load();
    }
  }

  get #attrs() {
    return TikTokVideoElement.observedAttributes.reduce((o, attr) => {
      const val = this.getAttribute(attr);
      if (val !== null) o[attr] = val === '' ? '1' : val;
      return o;
    }, {});
  }

  async #_resolveVideoId() {
    let src = this.getAttribute('src');
    if (!src) return null;

    // 1. Handle oEmbed URLs: extract the real video URL
    try {
      const url = new URL(src);
      if (url.pathname.endsWith('/oembed')) {
        const embedded = url.searchParams.get('url');
        if (embedded) src = embedded;
      }
    } catch {
      // Ignore invalid URLs
    }

    // 2. Normalize mobile domains (m.tiktok.com → www.tiktok.com)
    src = src.replace(/^https?:\/\/m\.tiktok\.com/, 'https://www.tiktok.com');

    // 3. Direct numeric ID
    if (/^\d{10,}$/.test(src)) return src;

    // 4. Embed v3
    let m = src.match(/embed\/v3\/(\d{10,})/);
    if (m) return m[1];

    // 5. Embed v1 / player URLs
    m = src.match(/player\/v1\/(\d{10,})/);
    if (m) return m[1];

    // 6. Standard paths & query formats
    m =
      src.match(/(?:embed|v|usr|user)\/(\d{10,})/) ||
      src.match(/[?&](?:shareId|item_id)=(\d{10,})/) ||
      src.match(/\/@[^/]+\/video\/(\d{10,})/);
    if (m) return m[1];

    // 7. Short links (vm.tiktok.com, vt.tiktok.com) via HEAD redirect
    if (/vm\.tiktok\.com|vt\.tiktok\.com/.test(src)) {
      try {
        const resp = await fetch(src, { method: 'HEAD', redirect: 'follow' });
        const loc = resp.url;
        m =
          loc.match(/embed\/v3\/(\d{10,})/) ||
          loc.match(/player\/v1\/(\d{10,})/) ||
          loc.match(/\/@[^/]+\/video\/(\d{10,})/) ||
          loc.match(/[?&](?:shareId|item_id)=(\d{10,})/);
        if (m) return m[1];
      } catch (e) {
        console.warn('Failed to resolve short link:', e);
      }
    }

    // No valid ID found
    return null;
  }

  get config() {
    return this.#_config;
  }

  set config(value) {
    this.#_config = value || {};
    this.load();
  }

  #_upgradeProperty(prop) {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  #_handleMessage(event) {
    const msg = event.data;
    if (!msg?.['x-tiktok-player']) return;

    switch (msg.type) {
      case 'onPlayerReady':
        this.#_loadComplete.resolve();
        break;

      case 'onStateChange':
        this.#_playerState = msg.value;
        this.#_paused = msg.value !== TikTokVideoElement.PlayerState.PLAYING;
        this.dispatchEvent(
          new Event(
            msg.value === TikTokVideoElement.PlayerState.PLAYING
              ? 'play'
              : msg.value === TikTokVideoElement.PlayerState.PAUSED
              ? 'pause'
              : msg.value === TikTokVideoElement.PlayerState.ENDED
              ? 'ended'
              : ''
          )
        );
        break;

      case 'onCurrentTime':
        this.#_currentTime = msg.value.currentTime;
        this.#_duration = msg.value.duration;
        this.dispatchEvent(new Event('durationchange'));
        this.dispatchEvent(new Event('timeupdate'));
        break;

      case 'onVolumeChange':
        this.#_volume = msg.value;
        this.dispatchEvent(new Event('volumechange'));
        break;

      case 'onMute':
        this.#_muted = msg.value ? true : false;
        this.#_volume = msg.value ? 0 : this.#_volume;
        this.dispatchEvent(new Event('volumechange'));
        break;

      case 'onError':
        this.dispatchEvent(new Event('error'));
        break;

      default:
        console.warn('Unhandled TikTok player message:', msg);
        break;
    }
  }

  #_post(type, value) {
    if (!this.iframe?.contentWindow) return;
    const message = { 'x-tiktok-player': true, type, ...(value !== undefined ? { value } : {}) };
    this.iframe.contentWindow.postMessage(message, '*');
  }

  async play() {
    await this.#_loadComplete;
    this.#_post('play');
  }

  async pause() {
    await this.#_loadComplete;
    this.#_post('pause');
  }

  async #_seekTo(sec) {
    await this.#_loadComplete;
    this.#_post('seekTo', Number(sec));
  }

  async mute() {
    await this.#_loadComplete;
    this.#_muted = true;
    this.#_post('mute');
  }

  async unMute() {
    await this.#_loadComplete;
    this.#_muted = false;
    this.#_post('unMute');
  }

  get volume() {
    return this.#_volume / 100;
  }
  set volume(val) {
    /* Currently commented since it's not working as intended. */
    console.warn('Volume control is not supported for TikTok videos.');
  }

  get currentTime() {
    return this.#_currentTime;
  }

  set currentTime(val) {
    this.#_seekTo(val);
  }

  get muted() {
    return this.#_muted;
  }

  set muted(val) {
    if (this.muted == val) return;
    val ? this.mute() : this.unMute();
  }

  get defaultMuted() {
    return this.hasAttribute('muted');
  }
  set defaultMuted(v) {
    v ? this.setAttribute('muted', '') : this.removeAttribute('muted');
  }

  get paused() {
    return this.#_paused;
  }

  get duration() {
    return this.#_duration;
  }

  get src() {
    return this.getAttribute('src');
  }
  set src(val) {
    this.setAttribute('src', val ?? '');
  }
}

if (globalThis.customElements && !globalThis.customElements.get('tiktok-video')) {
  globalThis.customElements.define('tiktok-video', TikTokVideoElement);
}

export default TikTokVideoElement;
