// https://developers.google.com/youtube/iframe_api_reference

const EMBED_BASE = 'https://www.youtube.com/embed';
const EMBED_BASE_NOCOOKIE = 'https://www.youtube-nocookie.com/embed';
const API_URL = 'https://www.youtube.com/iframe_api';
const API_GLOBAL = 'YT';
const API_GLOBAL_READY = 'onYouTubeIframeAPIReady';
const MATCH_SRC =
  /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))((\w|-){11})/;

function getTemplateHTML(attrs, props = {}) {
  const iframeAttrs = {
    src: serializeIframeUrl(attrs, props),
    frameborder: 0,
    width: '100%',
    height: '100%',
    allow: 'accelerometer; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture',
  };

  if (props.config) {
    // Serialize YouTube config on iframe so it can be quickly accessed on first load.
    // Required for React SSR because the custom element is initialized long before React client render.
    iframeAttrs['data-config'] = JSON.stringify(props.config);
  }

  return /*html*/`
    <style>
      :host {
        display: inline-block;
        line-height: 0;
        position: relative;
        min-width: 300px;
        min-height: 150px;
      }
      iframe {
        position: absolute;
        top: 0;
        left: 0;
      }
    </style>
    <iframe${serializeAttributes(iframeAttrs)}></iframe>
  `;
}

function serializeIframeUrl(attrs, props) {
  if (!attrs.src) return;

  const matches = attrs.src.match(MATCH_SRC);
  const srcId = matches && matches[1];

  const embedBase = attrs.src.includes('-nocookie')
    ? EMBED_BASE_NOCOOKIE
    : EMBED_BASE;

  const params = {
    // ?controls=true is enabled by default in the iframe
    controls: attrs.controls === '' ? null : 0,
    autoplay: attrs.autoplay,
    loop: attrs.loop,
    mute: attrs.muted,
    playsinline: attrs.playsinline,
    preload: attrs.preload ?? 'metadata',
    // https://developers.google.com/youtube/player_parameters#Parameters
    // origin: globalThis.location?.origin,
    enablejsapi: 1,
    showinfo: 0,
    rel: 0,
    iv_load_policy: 3,
    modestbranding: 1,
    ...props.config,
  };

  return `${embedBase}/${srcId}?${serialize(params)}`;
}

class YoutubeVideoElement extends (globalThis.HTMLElement ?? class {}) {
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
  #readyState = 0;
  #seeking = false;
  #seekComplete;
  isLoaded = false;
  #error = null;
  #config = null;

  constructor() {
    super();
    this.#upgradeProperty('config');
  }

  get config() {
    return this.#config;
  }

  set config(value) {
    this.#config = value;
  }

  async load() {
    if (this.#loadRequested) return;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    const isFirstLoad = !this.#hasLoaded;

    if (this.#hasLoaded) {
      this.loadComplete = new PublicPromise();
      this.isLoaded = false;
    }
    this.#hasLoaded = true;

    // Wait 1 tick to allow other attributes to be set.
    await (this.#loadRequested = Promise.resolve());
    this.#loadRequested = null;

    this.#readyState = 0;
    this.dispatchEvent(new Event('emptied'));

    let oldApi = this.api;
    this.api = null;

    if (!this.src) {
      // Removes the <iframe> containing the player.
      oldApi?.destroy();
      return;
    }

    this.dispatchEvent(new Event('loadstart'));

    let iframe = this.shadowRoot.querySelector('iframe');
    let attrs = namedNodeMapToObject(this.attributes);

    if (isFirstLoad && iframe) {
      this.#config = JSON.parse(iframe.getAttribute('data-config') || '{}');
    }

    if (!iframe?.src || iframe.src !== serializeIframeUrl(attrs, this)) {
      this.shadowRoot.innerHTML = getTemplateHTML(attrs, this);
      iframe = this.shadowRoot.querySelector('iframe');
    }

    const YT = await loadScript(API_URL, API_GLOBAL, API_GLOBAL_READY);
    this.api = new YT.Player(iframe, {
      events: {
        onReady: () => {
          this.#readyState = 1; // HTMLMediaElement.HAVE_METADATA
          this.dispatchEvent(new Event('loadedmetadata'));
          this.dispatchEvent(new Event('durationchange'));
          this.dispatchEvent(new Event('volumechange'));
          this.dispatchEvent(new Event('loadcomplete'));
          this.isLoaded = true;
          this.loadComplete.resolve();
        },
        onError: (error) => {
          console.error(error);
          this.#error = {
            code: error.data,
            message: `YouTube iframe player error #${error.data}; visit https://developers.google.com/youtube/iframe_api_reference#onError for the full error message.`
          }
          this.dispatchEvent(new Event('error'));
        },
      },
    });

    /* onStateChange
      -1 (unstarted)
      0 (ended)
      1 (playing)
      2 (paused)
      3 (buffering)
      5 (video cued).
    */

    let playFired = false;
    this.api.addEventListener('onStateChange', (event) => {
      const state = event.data;
      if (
        state === YT.PlayerState.PLAYING ||
        state === YT.PlayerState.BUFFERING
      ) {
        if (!playFired) {
          playFired = true;
          this.dispatchEvent(new Event('play'));
        }
      }

      if (state === YT.PlayerState.PLAYING) {
        if (this.seeking) {
          this.#seeking = false;
          this.#seekComplete?.resolve();
          this.dispatchEvent(new Event('seeked'));
        }
        this.#readyState = 3; // HTMLMediaElement.HAVE_FUTURE_DATA
        this.dispatchEvent(new Event('playing'));
      } else if (state === YT.PlayerState.PAUSED) {
        const diff = Math.abs(this.currentTime - lastCurrentTime);
        if (!this.seeking && diff > 0.1) {
          this.#seeking = true;
          this.dispatchEvent(new Event('seeking'));
        }
        playFired = false;
        this.dispatchEvent(new Event('pause'));
      }
      if (state === YT.PlayerState.ENDED) {
        playFired = false;
        this.dispatchEvent(new Event('pause'));
        this.dispatchEvent(new Event('ended'));

        if (this.loop) {
          this.play();
        }
      }
    });

    this.api.addEventListener('onPlaybackRateChange', () => {
      this.dispatchEvent(new Event('ratechange'));
    });

    this.api.addEventListener('onVolumeChange', () => {
      this.dispatchEvent(new Event('volumechange'));
    });

    this.api.addEventListener('onVideoProgress', () => {
      this.dispatchEvent(new Event('timeupdate'));
    });

    await this.loadComplete;

    let lastCurrentTime = 0;
    setInterval(() => {
      const diff = Math.abs(this.currentTime - lastCurrentTime);
      const bufferedEnd = this.buffered.end(this.buffered.length - 1);
      if (this.seeking && bufferedEnd > 0.1) {
        this.#seeking = false;
        this.#seekComplete?.resolve();
        this.dispatchEvent(new Event('seeked'));
      } else if (!this.seeking && diff > 0.1) {
        this.#seeking = true;
        this.dispatchEvent(new Event('seeking'));
      }
      lastCurrentTime = this.currentTime;
    }, 50);

    let lastBufferedEnd;
    const progressInterval = setInterval(() => {
      const bufferedEnd = this.buffered.end(this.buffered.length - 1);
      if (bufferedEnd >= this.duration) {
        clearInterval(progressInterval);
        this.#readyState = 4; // HTMLMediaElement.HAVE_ENOUGH_DATA
      }
      if (lastBufferedEnd != bufferedEnd) {
        lastBufferedEnd = bufferedEnd;
        this.dispatchEvent(new Event('progress'));
      }
    }, 100);
  }

  async attributeChangedCallback(attrName, oldValue, newValue) {
    if (oldValue === newValue) return;

    // This is required to come before the await for resolving loadComplete.
    switch (attrName) {
      case 'src':
      case 'autoplay':
      case 'controls':
      case 'loop':
      case 'playsinline': {
        this.load();
      }
    }
  }

  async play() {
    this.#seekComplete = null;
    await this.loadComplete;
    // yt.playVideo doesn't return a play promise.
    this.api?.playVideo();
    return createPlayPromise(this);
  }

  async pause() {
    await this.loadComplete;
    return this.api?.pauseVideo();
  }

  get seeking() {
    return this.#seeking;
  }

  get readyState() {
    return this.#readyState;
  }

  get src() {
    return this.getAttribute('src');
  }

  set src(val) {
    if (this.src == val) return;
    this.setAttribute('src', val);
  }

  get error() {
    return this.#error;
  }

  /* onStateChange
    -1 (unstarted)
    0 (ended)
    1 (playing)
    2 (paused)
    3 (buffering)
    5 (video cued).
  */

  get paused() {
    if (!this.isLoaded) return !this.autoplay;
    return [-1, 0, 2, 5].includes(this.api?.getPlayerState?.());
  }

  get duration() {
    return this.api?.getDuration?.() ?? NaN;
  }

  get autoplay() {
    return this.hasAttribute('autoplay');
  }

  set autoplay(val) {
    if (this.autoplay == val) return;
    this.toggleAttribute('autoplay', Boolean(val));
  }

  get buffered() {
    if (!this.isLoaded) return createTimeRanges();
    const progress =
      this.api?.getVideoLoadedFraction() * this.api?.getDuration();
    if (progress > 0) {
      return createTimeRanges(0, progress);
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
    return this.api?.getCurrentTime?.() ?? 0;
  }

  set currentTime(val) {
    if (this.currentTime == val) return;
    this.#seekComplete = new PublicPromise();
    this.loadComplete.then(() => {
      this.api?.seekTo(val, true);
      if (this.paused) {
        this.#seekComplete?.then(() => {
          if (!this.#seekComplete) return;
          this.api?.pauseVideo();
        });
      }
    });
  }

  set defaultMuted(val) {
    if (this.defaultMuted == val) return;
    this.toggleAttribute('muted', Boolean(val));
  }

  get defaultMuted() {
    return this.hasAttribute('muted');
  }

  get loop() {
    return this.hasAttribute('loop');
  }

  set loop(val) {
    if (this.loop == val) return;
    this.toggleAttribute('loop', Boolean(val));
  }

  set muted(val) {
    if (this.muted == val) return;
    this.loadComplete.then(() => {
      val ? this.api?.mute() : this.api?.unMute();
    });
  }

  get muted() {
    if (!this.isLoaded) return this.defaultMuted;
    return this.api?.isMuted?.();
  }

  get playbackRate() {
    return this.api?.getPlaybackRate?.() ?? 1;
  }

  set playbackRate(val) {
    if (this.playbackRate == val) return;
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

  set volume(val) {
    if (this.volume == val) return;
    this.loadComplete.then(() => {
      this.api?.setVolume(val * 100);
    });
  }

  get volume() {
    if (!this.isLoaded) return 1;
    return this.api?.getVolume() / 100;
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
    await delay(0);
    return self[globalName];
  }
  return (loadScriptCache[src] = new Promise(function (resolve, reject) {
    const script = document.createElement('script');
    script.src = src;
    const ready = () => resolve(self[globalName]);
    if (readyFnName) (self[readyFnName] = ready);
    script.onload = () => !readyFnName && ready();
    script.onerror = reject;
    document.head.append(script);
  }));
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function promisify(fn) {
  return (...args) =>
    new Promise((resolve) => {
      fn(...args, (...res) => {
        if (res.length > 1) resolve(res);
        else resolve(res[0]);
      });
    });
}

function createPlayPromise(player) {
  return promisify((event, cb) => {
    let fn;
    player.addEventListener(
      event,
      (fn = () => {
        player.removeEventListener(event, fn);
        cb();
      })
    );
  })('playing');
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

if (globalThis.customElements && !globalThis.customElements.get('youtube-video')) {
  globalThis.customElements.define('youtube-video', YoutubeVideoElement);
}

export default YoutubeVideoElement;
