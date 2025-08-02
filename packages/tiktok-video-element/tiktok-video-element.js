// https://developers.tiktok.com/doc/embed-player

const EMBED_BASE = 'https://www.tiktok.com/player/v1';
const MATCH_SRC = /tiktok\.com\/(?:player\/v1\/|share\/video\/|@[^/]+\/video\/)([0-9]+)/;

const PlayerState = { INIT: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 };

const EventMap = {
  [PlayerState.INIT]: 'emptied',
  [PlayerState.PAUSED]: 'pause',
  [PlayerState.ENDED]: 'ended',
  [PlayerState.PLAYING]: 'play',
  [PlayerState.BUFFERING]: 'waiting',
};

function getTemplateHTML(attrs, props = {}) {
  const iframeAttrs = {
    src: serializeIframeUrl(attrs, props),
    frameborder: 0,
    width: '100%',
    height: '100%',
    allow: 'accelerometer; autoplay; fullscreen; encrypted-media; gyroscope; picture-in-picture',
  };

  if (props.config) {
    // Serialize TikTok config on iframe so it can be quickly accessed on first load.
    // Required for React SSR because the custom element is initialized long before React client render.
    iframeAttrs['data-config'] = JSON.stringify(props.config);
  }

  return /*html*/ `
    <style>
      :host {
        display:inline-block;
        min-width: 300px;
        min-height: 150px;
        position: relative;
      }
      iframe {
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        border:0;
      }
    </style>
    <iframe ${serializeAttributes(iframeAttrs)} title="TikTok video"></iframe>
  `;
}

function serializeIframeUrl(attrs, props = {}) {
  if (!attrs.src) return;

  const matches = attrs.src.match(MATCH_SRC);
  const srcId = matches && matches[1];

  const params = {
    controls: attrs.controls === '' ? null : 0,
    autoplay: attrs.autoplay,
    muted: attrs.muted,
    loop: attrs.loop,
    rel: 0,
    ...props.config,
  };

  return `${EMBED_BASE}/${srcId}?${serialize(params)}`;
}

class TikTokVideoElement extends (globalThis.HTMLElement ?? class {}) {
  static getTemplateHTML = getTemplateHTML;
  static shadowRootOptions = { mode: 'open' };
  static get observedAttributes() {
    return ['src', 'controls', 'loop', 'autoplay', 'muted'];
  }

  loadComplete = new PublicPromise();
  #loadRequested;
  #hasLoaded;
  #muted = false;
  #currentTime = 0;
  #paused = true;
  #config = null;
  #volume = 100;
  #duration = 0;
  #iframe;

  constructor() {
    super();
    this.#upgradeProperty('config');
  }

  async load() {
    if (this.#loadRequested) return;

    if (!this.shadowRoot) {
      this.attachShadow(TikTokVideoElement.shadowRootOptions);
    }

    const isFirstLoad = !this.#hasLoaded;

    if (this.#hasLoaded) {
      this.loadComplete = new PublicPromise();
    }
    this.#hasLoaded = true;

    // Wait 1 tick to allow other attributes to be set.
    await (this.#loadRequested = Promise.resolve());
    this.#loadRequested = null;

    this.#currentTime = 0;
    this.#muted = false;
    this.#paused = true;

    if (!this.src) {
      this.shadowRoot.innerHTML = '';
      globalThis.removeEventListener('message', this.#onMessage);
      return;
    }

    let iframe = this.shadowRoot.querySelector('iframe');
    const attrs = namedNodeMapToObject(this.attributes);

    if (isFirstLoad && iframe) {
      this.#config = JSON.parse(iframe.getAttribute('data-config') || '{}');
    }

    if (!iframe?.src || iframe.src !== serializeIframeUrl(attrs, this)) {
      this.shadowRoot.innerHTML = getTemplateHTML(attrs, this);
      iframe = this.shadowRoot.querySelector('iframe');
    }

    this.#iframe = iframe;
    globalThis.addEventListener('message', this.#onMessage);
  }

  async attributeChangedCallback(attrName, oldValue, newValue) {
    if (oldValue === newValue) return;

    // This is required to come before the await for resolving loadComplete.
    switch (attrName) {
      case 'muted': {
        // The Tiktok player doesn't support muted as url param, so we need to set it after load.
        await this.loadComplete;
        this.muted = newValue != null;
        break;
      }
      case 'autoplay':
      case 'controls':
      case 'loop':
      case 'src': {
        this.load();
        return;
      }
    }
  }

  get config() {
    return this.#config;
  }

  set config(value) {
    this.#config = value;
  }

  #onMessage = (event) => {
    const msg = event.data;
    if (!msg?.['x-tiktok-player']) return;

    switch (msg.type) {
      case 'onPlayerReady':
        this.loadComplete.resolve();
        break;

      case 'onStateChange': {
        this.#paused = [PlayerState.INIT, PlayerState.PAUSED, PlayerState.ENDED].includes(msg.value);

        const eventType = EventMap[msg.value];
        if (eventType) this.dispatchEvent(new Event(eventType));
        break;
      }

      case 'onCurrentTime':
        this.#currentTime = msg.value.currentTime;
        this.#duration = msg.value.duration;
        this.dispatchEvent(new Event('durationchange'));
        this.dispatchEvent(new Event('timeupdate'));
        break;

      case 'onVolumeChange':
        this.#volume = msg.value;
        this.dispatchEvent(new Event('volumechange'));
        break;

      case 'onMute':
        this.#muted = msg.value ? true : false;
        this.#volume = msg.value ? 0 : this.#volume;
        this.dispatchEvent(new Event('volumechange'));
        break;

      case 'onError':
        this.dispatchEvent(new Event('error'));
        break;

      default:
        console.warn('Unhandled TikTok player message:', msg);
        break;
    }
  };

  #post(type, value) {
    if (!this.#iframe?.contentWindow) return;

    const message = { 'x-tiktok-player': true, type, ...(value !== undefined ? { value } : {}) };
    this.#iframe.contentWindow.postMessage(message, '*');
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

  async #mute() {
    await this.loadComplete;
    this.#post('mute');
  }

  async #unMute() {
    await this.loadComplete;
    this.#post('unMute');
  }

  get volume() {
    return this.#volume / 100;
  }

  set volume(_val) {
    /* Currently commented since it's not working as intended. */
    console.warn('Volume control is not supported for TikTok videos.');
  }

  get currentTime() {
    return this.#currentTime;
  }

  set currentTime(val) {
    this.#seekTo(val);
  }

  get muted() {
    return this.#muted;
  }

  set muted(val) {
    this.#muted = val;
    val ? this.#mute() : this.#unMute();
  }

  get defaultMuted() {
    return this.hasAttribute('muted');
  }

  set defaultMuted(val) {
    this.toggleAttribute('muted', !!val);
  }

  get paused() {
    return this.#paused;
  }

  get duration() {
    return this.#duration;
  }

  get src() {
    return this.getAttribute('src');
  }

  set src(val) {
    this.setAttribute('src', val ?? '');
  }

  // This is a pattern to update property values that are set before
  // the custom element is upgraded.
  // https://web.dev/custom-elements-best-practices/#make-properties-lazy
  #upgradeProperty(prop) {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const value = this[prop];
      // Delete the set property from this instance.
      delete this[prop];
      // Set the value again via the (prototype) setter on this class.
      this[prop] = value;
    }
  }
}

/**
 * A utility to create Promises with convenient public resolve and reject methods.
 * @return {Promise}
 */
class PublicPromise extends Promise {
  constructor(executor = () => {}) {
    let res, rej;
    super((resolve, reject) => {
      executor(resolve, reject);
      res = resolve;
      rej = reject;
    });
    this.resolve = res;
    this.reject = rej;
  }
}

function namedNodeMapToObject(namedNodeMap) {
  let obj = {};
  for (let attr of namedNodeMap) {
    obj[attr.name] = attr.value;
  }
  return obj;
}

function boolToBinary(props) {
  let p = {};
  for (let key in props) {
    let val = props[key];
    if (val === true || val === '') p[key] = 1;
    else if (val === false) p[key] = 0;
    else if (val != null) p[key] = val;
  }
  return p;
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

if (globalThis.customElements && !globalThis.customElements.get('tiktok-video')) {
  globalThis.customElements.define('tiktok-video', TikTokVideoElement);
}

export default TikTokVideoElement;
