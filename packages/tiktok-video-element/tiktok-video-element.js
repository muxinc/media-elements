const EMBED_BASE = 'https://www.tiktok.com/player/v1';

const serialize = (props) => {
  const boolToBinary = (props) => {
    let p = {};
    for (let key in props) {
      let val = props[key];
      if (val === true || val === '') p[key] = 1;
      else if (val === false) p[key] = 0;
      else if (val != null) p[key] = val;
    }
    return p;
  };
  return String(new URLSearchParams(boolToBinary(props)));
};

function serializeIframeUrl(attrs, id, config = {}) {
  const params = {
    controls: attrs.controls === undefined ? null : 1,
    autoplay: attrs.autoplay,
    loop: attrs.loop,
    rel: 0,
    ...config,
  };

  return `${EMBED_BASE}/${id}?${serialize(params)}`;
}

function getTemplateHTML(attrs, id, config = {}) {
  const src = serializeIframeUrl(attrs, id, config);
  const dataConfigAttr = config ? `data-config='${JSON.stringify(config).replace(/'/g, '&apos;')}'` : '';

  return /*html*/ `
    <style>
      :host { display:inline-block;position:relative;width:100%;height:100%; }
      iframe { position:absolute;top:0;left:0;width:100%;height:100%;border:0;}
    </style>
    <iframe src="${src}" ${dataConfigAttr} allow="autoplay; fullscreen" title="TikTok video"></iframe>
  `;
}

class TikTokVideoElement extends (globalThis.HTMLElement ?? class {}) {
  static getTemplateHTML = getTemplateHTML;
  static shadowRootOptions = { mode: 'open' };

  #muted = false;
  #trueMuted = false; // Used to track actual mute state

  static get observedAttributes() {
    return ['src', 'controls', 'loop', 'autoplay', 'muted'];
  }

  static PlayerState = { INIT: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.loadComplete = this.#createPublicPromise();
    this._currentTime = 0;
    this.#muted = false;
    this._paused = true;
    this.playerState = TikTokVideoElement.PlayerState.INIT;

    this._config = {};
    this.#upgradeProperty?.('config');

    this._onMessage = this.#handleMessage.bind(this);
  }

  connectedCallback() {
    window.addEventListener('message', this._onMessage);
    this.#render();
  }

  disconnectedCallback() {
    window.removeEventListener('message', this._onMessage);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name !== 'muted') {
      this.#render();
    } else {
     if (newValue !== null && newValue !== 'false') {
        this.mute();
      } else {
        this.unMute();
      }
    }
  }

  #createPublicPromise() {
    let res, rej;
    const p = new Promise((r, j) => {
      res = r;
      rej = j;
    });
    p.resolve = res;
    p.reject = rej;
    return p;
  }

  get #attrs() {
    return TikTokVideoElement.observedAttributes.reduce((o, attr) => {
      const val = this.getAttribute(attr);
      if (val !== null) o[attr] = val === '' ? '1' : val;
      return o;
    }, {});
  }

  async #resolveVideoId() {
    const src = this.getAttribute('src');
    if (!src) return null;

    // 1. Direct numeric ID
    if (/^\d{10,}$/.test(src)) return src;

    // 2. player/v1 URLs
    let m = src.match(/player\/v1\/(\d+)/);
    if (m) return m[1];

    // 3. embed, share paths, shareId or item_id
    m = src.match(/(?:embed|v|usr|user)\/(\d+)/) || src.match(/[?&](?:shareId|item_id)=(\d+)/);
    if (m) return m[1];

    // 4. watch URLs including optional username
    m = src.match(/\/@[^/]*\/video\/(\d+)/);
    if (m) return m[1];

    // 5. /@/video/ format
    m = src.match(/\/@\/video\/(\d+)/);
    if (m) return m[1];

    // 6. Short links—resolve via HEAD redirect
    if (/vm\.tiktok\.com|vt\.tiktok\.com/.test(src)) {
      try {
        const resp = await fetch(src, { method: 'HEAD', redirect: 'follow' });
        const final = resp.url;
        m =
          final.match(/\/video\/(\d+)/) ||
          final.match(/player\/v1\/(\d+)/) ||
          final.match(/[?&](?:shareId|item_id)=(\d+)/);
        if (m) return m[1];
      } catch (e) {
        console.error('Error resolving short link', e);
      }
    }

    return null;
  }

  async #render() {
    const id = await this.#resolveVideoId();
    if (!id) return;

    this.loadComplete = this.#createPublicPromise();

    this.shadowRoot.innerHTML = TikTokVideoElement.getTemplateHTML(this.#attrs, id, this.config);

    this.iframe = this.shadowRoot.querySelector('iframe');

  }

  get config() {
    return this._config;
  }

  set config(value) {
    this._config = value || {};
    this.#render();
  }

  #upgradeProperty(prop) {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  #handleMessage(event) {
    const msg = event.data;
    if (!msg?.['x-tiktok-player']) return;

    switch (msg.type) {
      case 'onPlayerReady':
        this.loadComplete.resolve();
        break;

      case 'onStateChange':
        this.playerState = msg.value;
        this._paused = msg.value !== TikTokVideoElement.PlayerState.PLAYING;
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
        this._currentTime = msg.value.currentTime;
        this._duration = msg.value.duration;
        this.dispatchEvent(new Event('durationchange'));
        this.dispatchEvent(new Event('timeupdate'));
        break;

      case 'onVolumeChange':
        this._volume = msg.value;
        this.dispatchEvent(new Event('volumechange'));
        if (msg.value === 0) {
          this.#muted = true;
        } else {
          this.#muted = false;
        }
        break;

      case 'onMute':
        this.#muted = msg.value ? true : false;
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

  #post(type, value) {
    if (!this.iframe?.contentWindow) return;
    const message = { 'x-tiktok-player': true, type, ...(value !== undefined ? { value } : {}) };
    this.iframe.contentWindow.postMessage(message, '*');
  }

  async play() {
    await this.loadComplete;
    this.#post('play');
  }

  async pause() {
    await this.loadComplete;
    this.#post('pause');
  }

  async #seekTo(sec) {
    await this.loadComplete;
    this.#post('seekTo', Number(sec));
  }

  async mute() {
    await this.loadComplete;
    this.#muted = true;
    this.#post('mute');
  }

  async unMute() {
    await this.loadComplete;
    this.#muted = false;
    this.#post('unMute');
  }

  /* Currently commented since it's not working as intended.

  async #changeVolume(val) {
    await this.loadComplete;
    this.#post('changeVolume', Math.round(Number(val)));
  }

  get volume() {
    return this._volume / 100;
  }
  set volume(val) {
    this.#changeVolume(val * 100);
  }

  */

  get volume() {
    return undefined;
  }

  set volume(_) {
    console.warn('Volume control is not supported for TikTok videos.');
  }

  get currentTime() {
    return this._currentTime;
  }
  set currentTime(val) {
    this.#seekTo(val);
  }

  get muted() {
    return this.#muted;
  }

  set muted(val) {
    if (this.muted == val) return;
    val ? this.mute() : this.unMute();
  }

  get paused() {
    return this._paused;
  }

  get duration() {
    return this._duration;
  }
}

if (globalThis.customElements && !globalThis.customElements.get('tiktok-video')) {
  globalThis.customElements.define('tiktok-video', TikTokVideoElement);
}

export default TikTokVideoElement;
