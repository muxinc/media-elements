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

function getTemplateHTML(attrs) {
  const iframeAttrs = {
    src: serializeIframeUrl(attrs),
    frameborder: 0,
    width: '100%',
    height: '100%',
    allow: 'accelerometer; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture',
  };

  return /*html*/`
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
    <iframe ${serializeAttributes(iframeAttrs)}></iframe>
  `;
}

function serializeIframeUrl(attrs) {
  if (!attrs.src) return;

  const matches = attrs.src.match(MATCH_SRC);
  const srcId = matches && matches[1];

  const params = {
    // ?controls=true is enabled by default in the iframe
    controls: attrs.controls === '' ? null : '0',
    autoplay: attrs.autoplay,
    loop: attrs.loop,
    muted: attrs.muted,
    preload: attrs.preload,
    poster: attrs.poster,
    defaultTextTrack: attrs.defaulttexttrack,
    primaryColor: attrs.primarycolor,
    letterboxColor: attrs.letterboxcolor,
    startTime: attrs.starttime,
    'ad-url': attrs.adurl,
  };

  return `${EMBED_BASE}/${srcId}?${serialize(removeFalsy(params))}`;
}

class CloudflareVideoElement extends (globalThis.HTMLElement ?? class {}) {
  static getTemplateHTML = getTemplateHTML;
  static shadowRootOptions = { mode: 'open' };
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
  #readyState = 0;

  constructor() {
    super();
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

    const matches = this.src.match(MATCH_SRC);
    const srcId = matches && matches[1];

    if (this.#noInit) {

      this.api = oldApi;
      this.api.src = srcId;

    } else {

      if (!this.shadowRoot) {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = getTemplateHTML(namedNodeMapToObject(this.attributes));
      }

      let iframe = this.shadowRoot.querySelector('iframe');

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
        if (this.api[attrName] !== this.hasAttribute(attrName)) {
          this.api[attrName] = this.hasAttribute(attrName);
        }
        break;
      }
      case 'poster':
      case 'preload': {
        if (this.api[attrName] !== this.getAttribute(attrName)) {
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
  return String(new URLSearchParams(props));
}

function removeFalsy(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null && v !== false)
  );
}

function namedNodeMapToObject(namedNodeMap) {
  let obj = {};
  for (let attr of namedNodeMap) {
    obj[attr.name] = attr.value;
  }
  return obj;
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

if (globalThis.customElements && !globalThis.customElements.get('cloudflare-video')) {
  globalThis.customElements.define('cloudflare-video', CloudflareVideoElement);
}

export default CloudflareVideoElement;
