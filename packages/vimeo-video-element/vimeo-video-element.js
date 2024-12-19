// https://github.com/vimeo/player.js
import VimeoPlayerAPI from '@vimeo/player/dist/player.es.js';

const EMBED_BASE = 'https://player.vimeo.com/video';
const MATCH_SRC = /vimeo\.com\/(?:video\/)?(\d+)(?:\/([\w-]+))?/;

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
    <iframe${serializeAttributes(iframeAttrs)}></iframe>
  `;
}

function serializeIframeUrl(attrs) {
  if (!attrs.src) return;

  const matches = attrs.src.match(MATCH_SRC);
  const srcId = matches && matches[1];
  const hParam = matches && matches[2];

  const params = {
    // ?controls=true is enabled by default in the iframe
    controls: attrs.controls === '' ? null : 0,
    autoplay: attrs.autoplay,
    loop: attrs.loop,
    muted: attrs.muted,
    playsinline: attrs.playsinline,
    preload: attrs.preload ?? 'metadata',
    transparent: false,
    autopause: attrs.autopause,
    h: hParam, // This param is required when the video is Unlisted.
  };

  return `${EMBED_BASE}/${srcId}?${serialize(params)}`;
}

class VimeoVideoElement extends (globalThis.HTMLElement ?? class {}) {
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

  loadComplete = new PublicPromise();
  #loadRequested;
  #hasLoaded;
  #isInit;
  #currentTime = 0;
  #duration = NaN;
  #muted = false;
  #paused = !this.autoplay;
  #playbackRate = 1;
  #progress = 0;
  #readyState = 0;
  #seeking = false;
  #volume = 1;
  #videoWidth = NaN;
  #videoHeight = NaN;

  async load() {
    if (this.#loadRequested) return;

    if (this.#hasLoaded) this.loadComplete = new PublicPromise();
    this.#hasLoaded = true;

    // Wait 1 tick to allow other attributes to be set.
    await (this.#loadRequested = Promise.resolve());
    this.#loadRequested = null;

    this.#currentTime = 0;
    this.#duration = NaN;
    this.#muted = false;
    this.#paused = !this.autoplay;
    this.#playbackRate = 1;
    this.#progress = 0;
    this.#readyState = 0;
    this.#seeking = false;
    this.#volume = 1;
    this.#readyState = 0;
    this.#videoWidth = NaN;
    this.#videoHeight = NaN;
    this.dispatchEvent(new Event('emptied'));

    let oldApi = this.api;
    this.api = null;

    if (!this.src) {
      return;
    }

    this.dispatchEvent(new Event('loadstart'));

    const options = {
      autoplay: this.autoplay,
      controls: this.controls,
      loop: this.loop,
      muted: this.defaultMuted,
      playsinline: this.playsInline,
      preload: this.preload ?? 'metadata',
      transparent: false,
      autopause: this.hasAttribute('autopause'),
    };

    const onLoaded = async () => {
      this.#readyState = 1; // HTMLMediaElement.HAVE_METADATA
      this.dispatchEvent(new Event('loadedmetadata'));

      if (this.api) {
        this.#muted = await this.api.getMuted();
        this.#volume = await this.api.getVolume();
        this.dispatchEvent(new Event('volumechange'));

        this.#duration = await this.api.getDuration();
        this.dispatchEvent(new Event('durationchange'));
      }

      this.dispatchEvent(new Event('loadcomplete'));
      this.loadComplete.resolve();
    };

    if (this.#isInit) {
      this.api = oldApi;
      await this.api.loadVideo({
        ...options,
        url: this.src,
      });
      await onLoaded();
      await this.loadComplete;
      return;
    }

    this.#isInit = true;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = getTemplateHTML(namedNodeMapToObject(this.attributes));
    }

    let iframe = this.shadowRoot.querySelector('iframe');

    this.api = new VimeoPlayerAPI(iframe);
    const onceLoaded = () => {
      this.api.off('loaded', onceLoaded);
      onLoaded();
    };
    this.api.on('loaded', onceLoaded);

    // Make sure a `play` event is fired before the bufferstart event.
    // For example Vimeo's `play` event is delayed decreasing video startup time.
    this.api.on('bufferstart', () => {
      if (this.#paused) {
        this.#paused = false;
        this.dispatchEvent(new Event('play'));
      }
      this.dispatchEvent(new Event('waiting'));
    });

    this.api.on('play', () => {
      if (!this.#paused) return;
      this.#paused = false;
      this.dispatchEvent(new Event('play'));
    });

    this.api.on('playing', () => {
      this.#readyState = 3; // HTMLMediaElement.HAVE_FUTURE_DATA
      this.#paused = false;
      this.dispatchEvent(new Event('playing'));
    });

    this.api.on('seeking', () => {
      this.#seeking = true;
      this.dispatchEvent(new Event('seeking'));
    });

    this.api.on('seeked', () => {
      this.#seeking = false;
      this.dispatchEvent(new Event('seeked'));
    });

    this.api.on('pause', () => {
      this.#paused = true;
      this.dispatchEvent(new Event('pause'));
    });

    this.api.on('ended', () => {
      this.#paused = true;
      this.dispatchEvent(new Event('ended'));
    });

    this.api.on('ratechange', ({ playbackRate }) => {
      this.#playbackRate = playbackRate;
      this.dispatchEvent(new Event('ratechange'));
    });

    this.api.on('volumechange', async ({ volume }) => {
      this.#volume = volume;
      if (this.api) {
        this.#muted = await this.api.getMuted();
      }
      this.dispatchEvent(new Event('volumechange'));
    });

    this.api.on('durationchange', ({ duration }) => {
      this.#duration = duration;
      this.dispatchEvent(new Event('durationchange'));
    });

    this.api.on('timeupdate', ({ seconds }) => {
      this.#currentTime = seconds;
      this.dispatchEvent(new Event('timeupdate'));
    });

    this.api.on('progress', ({ seconds }) => {
      this.#progress = seconds;
      this.dispatchEvent(new Event('progress'));
    });

    this.api.on('resize', ({ videoWidth, videoHeight }) => {
      this.#videoWidth = videoWidth;
      this.#videoHeight = videoHeight;
      this.dispatchEvent(new Event('resize'));
    });

    await this.loadComplete;
  }

  async attributeChangedCallback(attrName, oldValue, newValue) {
    if (oldValue === newValue) return;

    // This is required to come before the await for resolving loadComplete.
    switch (attrName) {
      case 'autoplay':
      case 'controls':
      case 'src': {
        this.load();
        return;
      }
    }

    await this.loadComplete;

    switch (attrName) {
      case 'loop': {
        this.api.setLoop(this.loop);
        break;
      }
    }
  }

  async play() {
    this.#paused = false;
    this.dispatchEvent(new Event('play'));

    await this.loadComplete;

    try {
      await this.api?.play();
    } catch (error) {
      this.#paused = true;
      this.dispatchEvent(new Event('pause'));
      throw error;
    }
  }

  async pause() {
    await this.loadComplete;
    return this.api?.pause();
  }

  get ended() {
    return this.#currentTime >= this.#duration;
  }

  get seeking() {
    return this.#seeking;
  }

  get readyState() {
    return this.#readyState;
  }

  get videoWidth() {
    return this.#videoWidth;
  }

  get videoHeight() {
    return this.#videoHeight;
  }

  get src() {
    return this.getAttribute('src');
  }

  set src(val) {
    if (this.src == val) return;
    this.setAttribute('src', val);
  }

  get paused() {
    return this.#paused;
  }

  get duration() {
    return this.#duration;
  }

  get autoplay() {
    return this.hasAttribute('autoplay');
  }

  set autoplay(val) {
    if (this.autoplay == val) return;
    this.toggleAttribute('autoplay', Boolean(val));
  }

  get buffered() {
    if (this.#progress > 0) {
      return createTimeRanges(0, this.#progress);
    }
    return createTimeRanges();
  }

  get controls() {
    return this.hasAttribute('controls');
  }

  set controls(val) {
    if (this.controls == val) return;
    this.toggleAttribute('controls', Boolean(val));
  }

  get currentTime() {
    return this.#currentTime;
  }

  set currentTime(val) {
    if (this.currentTime == val) return;
    this.#currentTime = val;
    this.loadComplete.then(() => {
      this.api?.setCurrentTime(val);
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
    return this.#muted;
  }

  set muted(val) {
    if (this.muted == val) return;
    this.#muted = val;
    this.loadComplete.then(() => {
      this.api?.setMuted(val);
    });
  }

  get playbackRate() {
    return this.#playbackRate;
  }

  set playbackRate(val) {
    if (this.playbackRate == val) return;
    this.#playbackRate = val;
    this.loadComplete.then(() => {
      this.api?.setPlaybackRate(val);
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
    return this.#volume;
  }

  set volume(val) {
    if (this.volume == val) return;
    this.#volume = val;
    this.loadComplete.then(() => {
      this.api?.setVolume(val);
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

/**
 * Creates a fake `TimeRanges` object.
 *
 * A TimeRanges object. This object is normalized, which means that ranges are
 * ordered, don't overlap, aren't empty, and don't touch (adjacent ranges are
 * folded into one bigger range).
 *
 * @param  {(Number|Array)} Start of a single range or an array of ranges
 * @param  {Number} End of a single range
 * @return {Array}
 */
function createTimeRanges(start, end) {
  if (Array.isArray(start)) {
    return createTimeRangesObj(start);
  } else if (start == null || end == null || (start === 0 && end === 0)) {
    return createTimeRangesObj([[0, 0]]);
  }
  return createTimeRangesObj([[start, end]]);
}

function createTimeRangesObj(ranges) {
  Object.defineProperties(ranges, {
    start: {
      value: i => ranges[i][0]
    },
    end: {
      value: i => ranges[i][1]
    }
  });
  return ranges;
}

if (globalThis.customElements && !globalThis.customElements.get('vimeo-video')) {
  globalThis.customElements.define('vimeo-video', VimeoVideoElement);
}

export default VimeoVideoElement;
