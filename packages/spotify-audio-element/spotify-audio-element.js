// https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api

const EMBED_BASE = 'https://open.spotify.com';
const MATCH_SRC = /open\.spotify\.com\/(\w+)\/(\w+)/i;
const API_URL = 'https://open.spotify.com/embed-podcast/iframe-api/v1';
const API_GLOBAL = 'SpotifyIframeApi';
const API_GLOBAL_READY = 'onSpotifyIframeApiReady';

function getTemplateHTML(attrs, props = {}) {
  const iframeAttrs = {
    src: serializeIframeUrl(attrs, props),
    frameborder: 0,
    width: '100%',
    height: '100%',
    allow: 'accelerometer; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture',
  };

  return /*html*/`
    <style>
      :host {
        display: inline-block;
        min-width: 160px;
        min-height: 80px;
        position: relative;
      }
      iframe {
        position: absolute;
        top: 0;
        left: 0;
      }
      :host(:not([controls])) {
        display: none !important;
      }
    </style>
    <iframe${serializeAttributes(iframeAttrs)}></iframe>
  `;
}

function serializeIframeUrl(attrs, props) {
  if (!attrs.src) return;

  const matches = attrs.src.match(MATCH_SRC);
  const type = matches && matches[1];
  const metaId = matches && matches[2];

  const params = {
    t: props.config?.startAt,
    theme: props.config?.theme === 'dark' ? '0' : null,
  };

  const videoPath = props.config?.preferVideo ? '/video' : '';
  return `${EMBED_BASE}/embed/${type}/${metaId}${videoPath}?${serialize(params)}`;
}

class SpotifyAudioElement extends (globalThis.HTMLElement ?? class {}) {
  static getTemplateHTML = getTemplateHTML;
  static shadowRootOptions = { mode: 'open' };
  static observedAttributes = [
    'controls',
    'loop',
    'src',
  ];

  loadComplete = new PublicPromise();
  #loadRequested;
  #hasLoaded;
  #isInit;
  #isWaiting = false;
  #closeToEnded = false;

  #paused = true;
  #currentTime = 0;
  #duration = NaN;
  #seeking = false;
  #config = null;

  constructor() {
    super();
    this.#upgradeProperty('config');
  }

  async load() {
    if (this.#loadRequested) return;

    if (this.#hasLoaded) this.loadComplete = new PublicPromise();
    this.#hasLoaded = true;

    // Wait 1 tick to allow other attributes to be set.
    await (this.#loadRequested = Promise.resolve());
    this.#loadRequested = null;

    this.#isWaiting = false;
    this.#closeToEnded = false;

    this.#currentTime = 0;
    this.#duration = NaN;
    this.#seeking = false;

    this.dispatchEvent(new Event('emptied'));

    let oldApi = this.api;
    this.api = null;

    if (!this.src) {
      return;
    }

    this.dispatchEvent(new Event('loadstart'));

    const options = {
      t: this.config?.startAt,
      theme: this.config?.theme === 'dark' ? '0' : null,
    };

    if (this.#isInit) {
      this.api = oldApi;
      this.api.iframeElement.src = serializeIframeUrl(namedNodeMapToObject(this.attributes));

    } else {
      this.#isInit = true;

      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = getTemplateHTML(namedNodeMapToObject(this.attributes));
      }

      let iframe = this.shadowRoot.querySelector('iframe');

      const Spotify = await loadScript(API_URL, API_GLOBAL, API_GLOBAL_READY);

      this.api = await new Promise((resolve) =>
        Spotify.createController(iframe, options, resolve));
      this.api.iframeElement = iframe;

      this.api.addListener('ready', () => {
        this.dispatchEvent(new Event('loadedmetadata'));
        this.dispatchEvent(new Event('durationchange'));
        this.dispatchEvent(new Event('volumechange'));
      });

      // If everyone could just use the HTMLMediaElement API for their player API's :(

      this.api.addListener('playback_update', (event) => {

        if (this.#closeToEnded && this.#paused && (event.data.isBuffering || !event.data.isPaused)) {
          this.#closeToEnded = false;
          this.currentTime = 1;
          return;
        }

        if (event.data.duration / 1000 !== this.#duration) {
          this.#closeToEnded = false;
          this.#duration = event.data.duration / 1000;
          this.dispatchEvent(new Event('durationchange'));
        }

        if (event.data.position / 1000 !== this.#currentTime) {
          this.#seeking = false;
          this.#closeToEnded = false;
          this.#currentTime = event.data.position / 1000;
          this.dispatchEvent(new Event('timeupdate'));
        }

        if (!this.#isWaiting && !this.#paused && event.data.isPaused) {
          this.#paused = true;
          this.dispatchEvent(new Event('pause'));
          return;
        }

        if (this.#paused && (event.data.isBuffering || !event.data.isPaused)) {
          this.#paused = false;
          this.dispatchEvent(new Event('play'));

          this.#isWaiting = event.data.isBuffering;

          if (this.#isWaiting) {
            this.dispatchEvent(new Event('waiting'));
          } else {
            this.dispatchEvent(new Event('playing'));
          }
          return;
        }

        if (this.#isWaiting && !event.data.isPaused) {
          this.#isWaiting = false;
          this.dispatchEvent(new Event('playing'));
          return;
        }

        if (!this.paused && !this.seeking && !this.#closeToEnded && Math.ceil(this.currentTime) >= this.duration) {
          this.#closeToEnded = true;

          if (this.loop) {
            this.currentTime = 1;
            return;
          }

          if (!this.continuous) {
            this.pause();
            this.dispatchEvent(new Event('ended'));
          }
          return;
        }
      });
    }

    this.loadComplete.resolve();
    await this.loadComplete;
  }

  async attributeChangedCallback(attrName, oldValue, newValue) {
    if (oldValue === newValue) return;

    // This is required to come before the await for resolving loadComplete.
    switch (attrName) {
      case 'src': {
        this.load();
        return;
      }
    }
  }

  async play() {
    this.#paused = false;
    this.#isWaiting = true;
    this.dispatchEvent(new Event('play'));

    await this.loadComplete;

    return this.api?.resume();
  }

  async pause() {
    await this.loadComplete;
    return this.api?.pause();
  }

  get config() {
    return this.#config;
  }

  set config(value) {
    this.#config = value;
  }

  get paused() {
    return this.#paused ?? true;
  }

  get muted() {
    return false;
  }

  get volume() {
    return 1;
  }

  get ended() {
    return Math.ceil(this.currentTime) >= this.duration;
  }

  get seeking() {
    return this.#seeking;
  }

  get loop() {
    return this.hasAttribute('loop');
  }

  set loop(val) {
    if (this.loop == val) return;
    this.toggleAttribute('loop', Boolean(val));
  }

  get currentTime() {
    return this.#currentTime;
  }

  set currentTime(val) {
    if (this.currentTime == val) return;

    this.#seeking = true;

    let oldTime = this.#currentTime;
    this.#currentTime = val;
    this.dispatchEvent(new Event('timeupdate'));
    this.#currentTime = oldTime;

    this.loadComplete.then(() => {
      this.api?.seek(val);
    });
  }

  get duration() {
    return this.#duration;
  }

  get src() {
    return this.getAttribute('src');
  }

  set src(val) {
    this.setAttribute('src', `${val}`);
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

function serializeAttributes(attrs) {
  let html = '';
  for (const key in attrs) {
    const value = attrs[key];
    if (value === '') html += ` ${key}`;
    else html += ` ${key}="${value}"`;
  }
  return html;
}

function serialize(props) {
  return String(new URLSearchParams(boolToBinary(props)));
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

function namedNodeMapToObject(namedNodeMap) {
  let obj = {};
  for (let attr of namedNodeMap) {
    obj[attr.name] = attr.value;
  }
  return obj;
}

const loadScriptCache = {};
async function loadScript(src, globalName, readyFnName) {
  if (loadScriptCache[src]) return loadScriptCache[src];
  if (globalName && self[globalName]) {
    return Promise.resolve(self[globalName]);
  }
  return (loadScriptCache[src] = new Promise(function (resolve, reject) {
    const script = document.createElement('script');
    script.src = src;
    const ready = (api) => resolve(api);
    if (readyFnName) (self[readyFnName] = ready);
    script.onload = () => !readyFnName && ready();
    script.onerror = reject;
    document.head.append(script);
  }));
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

if (globalThis.customElements && !globalThis.customElements.get('spotify-audio')) {
  globalThis.customElements.define('spotify-audio', SpotifyAudioElement);
}

export default SpotifyAudioElement;
