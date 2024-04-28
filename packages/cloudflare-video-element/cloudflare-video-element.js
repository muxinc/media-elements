// https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/using-the-player-api/

export const VideoEvents = [
  'abort',
  'canplay',
  'canplaythrough',
  'durationchange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'pause',
  'play',
  'playing',
  'progress',
  'ratechange',
  'seeked',
  'seeking',
  'stalled',
  'suspend',
  'timeupdate',
  'volumechange',
  'waiting',
  'waitingforkey',
  'resize',
  'enterpictureinpicture',
  'leavepictureinpicture',

  // custom events
  'stream-adstart',
  'stream-adend',
  'stream-adtimeout'
];

const EMBED_BASE = 'https://iframe.videodelivery.net';
const MATCH_SRC = /(?:cloudflarestream\.com|videodelivery\.net)\/([\w-.]+)/i;
const API_URL = 'https://embed.videodelivery.net/embed/sdk.latest.js';
const API_GLOBAL = 'Stream';

const templateShadowDOM = globalThis.document?.createElement('template');
templateShadowDOM.innerHTML = /*html*/`
<style>
  :host {
    display: inline-block;
    min-width: 300px;
    min-height: 150px;
    position: relative;
  }
  iframe {
    position: absolute;
    top: 0;
    left: 0;
  }
  :host(:not([controls])) {
    pointer-events: none;
  }
</style>
`;

class CloudflareVideoElement extends (globalThis.HTMLElement ?? class {}) {
  static observedAttributes = [
    'autoplay',
    'controls',
    'crossorigin',
    'loop',
    'muted',
    'playsinline',
    'poster',
    'preload',
    'src',
  ];

  #hasLoaded;
  #noInit;
  #options;
  #readyState = 0;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(templateShadowDOM.content.cloneNode(true));

    this.loadComplete = new PublicPromise();
  }

  async load() {
    if (this.#hasLoaded) {
      this.loadComplete = new PublicPromise();
      this.#noInit = true;
    }
    this.#hasLoaded = true;

    this.#readyState = 0;
    this.dispatchEvent(new Event('emptied'));

    let oldApi = this.api;
    this.api = null;

    // Wait 1 tick to allow other attributes to be set.
    await Promise.resolve();

    if (!this.src) {
      return;
    }

    this.#options = {
      autoplay: this.autoplay,
      controls: this.controls,
      loop: this.loop,
      muted: this.defaultMuted,
      playsinline: this.playsInline,
      preload: this.preload,
      poster: this.poster,
      defaultTextTrack: this.getAttribute('defaulttexttrack'),
      primaryColor: this.getAttribute('primarycolor'),
      letterboxColor: this.getAttribute('letterboxcolor'),
      startTime: this.getAttribute('starttime'),
      'ad-url': this.getAttribute('adurl'),
    };

    const matches = this.src.match(MATCH_SRC);
    const srcId = matches && matches[1];

    if (this.#noInit) {

      this.api = oldApi;
      this.api.src = srcId;

    } else {

      const src = `${EMBED_BASE}/${srcId}?${serialize(removeFalsy({
        ...this.#options,
        // ?controls=true is enabled by default in the iframe
        controls: this.#options.controls ? null : '0'
      }))}`;

      let iframe = this.shadowRoot.querySelector('iframe');
      if (!iframe) {
        iframe = createEmbedIframe({ src });
        this.shadowRoot.append(iframe);
      }

      const Stream = await loadScript(API_URL, API_GLOBAL);
      this.api = Stream(iframe);

      this.api.addEventListener('loadedmetadata', () => {
        this.#readyState = 1; // HTMLMediaElement.HAVE_METADATA
      });

      this.api.addEventListener('loadeddata', () => {
        this.#readyState = 2; // HTMLMediaElement.HAVE_CURRENT_DATA
      });

      this.api.addEventListener('playing', () => {
        this.#readyState = 3; // HTMLMediaElement.HAVE_FUTURE_DATA
      });

      // The video events are dispatched on the api instance.
      // This makes it possible to add event listeners before the element is upgraded.
      for (let type of VideoEvents) {
        this.api.addEventListener(type, (evt) => {
          this.dispatchEvent(new Event(evt.type));
        });
      }
    }

    this.api.addEventListener('loadstart', () => {
      this.dispatchEvent(new Event('loadcomplete'));
      this.loadComplete.resolve();
    });

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

    switch (attrName) {
      case 'autoplay':
      case 'controls':
      case 'loop': {
        if (this.#options[attrName] !== this.hasAttribute(attrName)) {
          this.api[attrName] = this.hasAttribute(attrName);
        }
        break;
      }
      case 'poster':
      case 'preload': {
        if (this.#options[attrName] !== this.getAttribute(attrName)) {
          this.api[attrName] = this.getAttribute(attrName);
        }
        break;
      }
    }
  }

  async play() {
    await this.loadComplete;
    return this.api?.play();
  }

  async pause() {
    await this.loadComplete;
    return this.api?.pause();
  }

  get ended() {
    return this.api?.ended ?? false;
  }

  get seeking() {
    return this.api?.seeking;
  }

  get readyState() {
    return this.#readyState;
  }

  get videoWidth() {
    return this.api?.videoWidth;
  }

  get videoHeight() {
    return this.api?.videoHeight;
  }

  get preload() {
    return this.getAttribute('preload');
  }

  set preload(val) {
    if (this.preload == val) return;
    this.setAttribute('preload', `${val}`);
  }

  get src() {
    return this.getAttribute('src');
  }

  set src(val) {
    if (this.src == val) return;
    this.setAttribute('src', `${val}`);
  }

  get paused() {
    return this.api?.paused ?? true;
  }

  get duration() {
    if (this.api?.duration > 0) {
      return this.api?.duration;
    }
    return NaN;
  }

  get autoplay() {
    return this.hasAttribute('autoplay');
  }

  set autoplay(val) {
    if (this.autoplay == val) return;
    this.toggleAttribute('autoplay', Boolean(val));
  }

  get buffered() {
    return this.api?.buffered;
  }

  get played() {
    return this.api?.played;
  }

  get controls() {
    return this.hasAttribute('controls');
  }

  set controls(val) {
    if (this.controls == val) return;
    this.toggleAttribute('controls', Boolean(val));
  }

  get currentTime() {
    return this.api?.currentTime ?? 0;
  }

  set currentTime(val) {
    if (this.currentTime == val) return;

    this.loadComplete.then(() => {
      this.api.currentTime = val;
    });
  }

  get defaultMuted() {
    return this.hasAttribute('muted');
  }

  set defaultMuted(val) {
    if (this.defaultMuted == val) return;
    this.toggleAttribute('muted', Boolean(val));
  }

  get loop() {
    return this.hasAttribute('loop');
  }

  set loop(val) {
    if (this.loop == val) return;
    this.toggleAttribute('loop', Boolean(val));
  }

  get muted() {
    return this.api?.muted ?? this.defaultMuted;
  }

  set muted(val) {
    if (this.muted == val) return;

    this.loadComplete.then(() => {
      this.api.muted = val;
    });
  }

  get playbackRate() {
    return this.api?.playbackRate ?? 1;
  }

  set playbackRate(val) {
    if (this.playbackRate == val) return;

    this.loadComplete.then(() => {
      this.api.playbackRate = val;
    });
  }

  get playsInline() {
    return this.hasAttribute('playsinline');
  }

  set playsInline(val) {
    if (this.playsInline == val) return;
    this.toggleAttribute('playsinline', Boolean(val));
  }

  get poster() {
    return this.getAttribute('poster');
  }

  set poster(val) {
    if (this.poster == val) return;
    this.setAttribute('poster', `${val}`);
  }

  get volume() {
    return this.api?.volume ?? 1;
  }

  set volume(val) {
    if (this.volume == val) return;

    this.loadComplete.then(() => {
      this.api.volume = val;
    });
  }
}

const loadScriptCache = {};
async function loadScript(src, globalName) {
  if (loadScriptCache[src]) return loadScriptCache[src];
  if (globalName && self[globalName]) {
    await delay(0);
    return self[globalName];
  }
  return (loadScriptCache[src] = new Promise(function (resolve, reject) {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(self[globalName]);
    script.onerror = reject;
    document.head.append(script);
  }));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  'accelerometer; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture';

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

function serialize(props) {
  return String(new URLSearchParams(props));
}

function removeFalsy(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v));
}

if (globalThis.customElements && !globalThis.customElements.get('cloudflare-video')) {
  globalThis.customElements.define('cloudflare-video', CloudflareVideoElement);
}

export default CloudflareVideoElement;
