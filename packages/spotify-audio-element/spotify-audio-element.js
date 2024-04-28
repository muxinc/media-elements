// https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api

const EMBED_BASE = 'https://open.spotify.com';
const MATCH_SRC = /open\.spotify\.com\/(\w+)\/(\w+)/i;
const API_URL = 'https://open.spotify.com/embed-podcast/iframe-api/v1';
const API_GLOBAL = 'SpotifyIframeApi';
const API_GLOBAL_READY = 'onSpotifyIframeApiReady';

const templateShadowDOM = globalThis.document?.createElement('template');
if (templateShadowDOM) {
  templateShadowDOM.innerHTML = /*html*/`
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
  `;
}

class SpotifyAudioElement extends (globalThis.HTMLElement ?? class {}) {
  static observedAttributes = [
    'controls',
    'loop',
    'src',
    'starttime',
    'continuous',
  ];

  #hasLoaded;
  #apiInit;
  #options;
  #isWaiting = false;
  #closeToEnded = false;

  #paused = true;
  #currentTime = 0;
  #duration = NaN;
  #seeking = false;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(templateShadowDOM.content.cloneNode(true));

    this.loadComplete = new PublicPromise();
  }

  async load() {
    if (this.#hasLoaded) {
      this.loadComplete = new PublicPromise();
    }

    this.#hasLoaded = true;
    this.#isWaiting = false;
    this.#closeToEnded = false;

    this.#currentTime = 0;
    this.#duration = NaN;
    this.#seeking = false;

    this.dispatchEvent(new Event('emptied'));

    let oldApi = this.api;
    this.api = null;

    // Wait 1 tick to allow other attributes to be set.
    await Promise.resolve();

    if (!this.src) {
      return;
    }

    this.dispatchEvent(new Event('loadstart'));

    this.#options = {
      width: '100%',
      height: '100%',
      t: this.startTime,
      theme: this.theme === 'dark' ? '0' : null,
    };

    const matches = this.src.match(MATCH_SRC);
    const type = matches && matches[1];
    const metaId = matches && matches[2];
    const src = `${EMBED_BASE}/embed/${type}/${metaId}?${serialize(this.#options)}`;

    if (this.#apiInit) {
      this.api = oldApi;
      this.api.iframeElement.src = src;

    } else {
      this.#apiInit = true;

      let iframe = this.shadowRoot.querySelector('iframe');
      if (!iframe) {
        iframe = createEmbedIframe({ src });
        this.shadowRoot.append(iframe);
      }

      const Spotify = await loadScript(API_URL, API_GLOBAL, API_GLOBAL_READY);

      this.api = await new Promise((resolve) =>
        Spotify.createController(iframe, this.#options, resolve));
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
    // This is required to come before the await for resolving loadComplete.
    switch (attrName) {
      case 'src': {
        if (oldValue !== newValue) {
          this.load();
        }
        return;
      }
    }

    await this.loadComplete;
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

  get startTime() {
    return parseFloat(this.getAttribute('starttime') ?? 0);
  }

  set startTime(val) {
    if (this.startTime == val) return;
    this.setAttribute('starttime', +val);
  }

  get theme() {
    return this.getAttribute('theme');
  }

  set theme(val) {
    this.setAttribute('theme', val);
  }

  get continuous() {
    return this.hasAttribute('continuous');
  }

  set continuous(val) {
    if (this.continuous == val) return;
    this.toggleAttribute('continuous', Boolean(val));
  }
}

function serialize(props) {
  Object.keys(props).forEach(key => props[key] == null && delete props[key]);
  return String(new URLSearchParams(props));
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

function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.keys(attrs).forEach(
    (name) => attrs[name] != null && el.setAttribute(name, attrs[name])
  );
  el.append(...children);
  return el;
}

const allow =
  'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';

function createEmbedIframe({ src, ...props }) {
  return createElement('iframe', {
    src,
    width: '100%',
    height: '100%',
    allow,
    frameborder: 0,
    ...props,
  });
}

if (globalThis.customElements && !globalThis.customElements.get('spotify-audio')) {
  globalThis.customElements.define('spotify-audio', SpotifyAudioElement);
}

export default SpotifyAudioElement;
