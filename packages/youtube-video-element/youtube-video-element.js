// https://developers.google.com/youtube/iframe_api_reference

const EMBED_BASE = 'https://www.youtube.com/embed';
const API_URL = 'https://www.youtube.com/iframe_api';
const API_GLOBAL = 'YT';
const API_GLOBAL_READY = 'onYouTubeIframeAPIReady';
const MATCH_SRC =
  /(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/;

const templateShadowDOM = globalThis.document?.createElement('template');
if (templateShadowDOM) {
  templateShadowDOM.innerHTML = /*html*/`
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
  `;
}

class YoutubeVideoElement extends (globalThis.HTMLElement ?? class {}) {
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

  #options;
  #readyState = 0;
  #seeking = false;
  #seekComplete;
  isLoaded = false;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(templateShadowDOM.content.cloneNode(true));

    this.loadComplete = new PublicPromise();
  }

  async load() {
    if (this.hasLoaded) {
      this.loadComplete = new PublicPromise();
      this.isLoaded = false;
    }
    this.hasLoaded = true;

    this.#readyState = 0;
    this.dispatchEvent(new Event('emptied'));

    let oldApi = this.api;
    this.api = null;

    // Wait 1 tick to allow other attributes to be set.
    await Promise.resolve();

    oldApi?.destroy();

    if (!this.src) {
      return;
    }

    this.dispatchEvent(new Event('loadstart'));

    this.#options = {
      autoplay: this.autoplay,
      controls: this.controls,
      loop: this.loop,
      mute: this.defaultMuted,
      playsinline: this.playsInline,
      preload: this.preload ?? 'metadata',
      origin: location.origin,
      enablejsapi: 1,
      showinfo: 0,
      rel: 0,
      iv_load_policy: 3,
      modestbranding: 1,
    };

    const matches = this.src.match(MATCH_SRC);
    const metaId = matches && matches[1];
    const src = `${EMBED_BASE}/${metaId}?${serialize(
      boolToBinary(this.#options)
    )}`;
    let iframe = this.shadowRoot.querySelector('iframe');
    if (!iframe) {
      iframe = createEmbedIframe({ src });
      this.shadowRoot.append(iframe);
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
        onError: (error) => console.error(error),
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

  async attributeChangedCallback(attrName) {
    // This is required to come before the await for resolving loadComplete.
    switch (attrName) {
      case 'src': {
        this.load();
        return;
      }
    }

    await this.loadComplete;

    switch (attrName) {
      case 'autoplay':
      case 'controls':
      case 'loop':
      case 'playsinline': {
        if (this.#options[attrName] !== this.hasAttribute(attrName)) {
          this.load();
        }
        break;
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

  // If the getter from SuperVideoElement is overridden, it's required to define
  // the setter again too unless it's a read only property! It's a JS thing.

  get src() {
    return this.getAttribute('src');
  }

  set src(val) {
    if (this.src == val) return;
    this.setAttribute('src', val);
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
    if (val) this.setAttribute('autoplay', '');
    else this.removeAttribute('autoplay');
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
    if (val) this.setAttribute('controls', '');
    else this.removeAttribute('controls');
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
    if (val) this.setAttribute('muted', '');
    else this.removeAttribute('muted');
  }

  get defaultMuted() {
    return this.hasAttribute('muted');
  }

  get loop() {
    return this.hasAttribute('loop');
  }

  set loop(val) {
    if (this.loop == val) return;
    if (val) this.setAttribute('loop', '');
    else this.removeAttribute('loop');
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
    if (val) this.setAttribute('playsinline', '');
    else this.removeAttribute('playsinline');
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

function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.keys(attrs).forEach(
    (name) => attrs[name] != null && el.setAttribute(name, attrs[name])
  );
  el.append(...children);
  return el;
}

const allow =
  'accelerometer; autoplay; fullscreen; encrypted-media; gyroscope; picture-in-picture';

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
  return Object.keys(props)
    .map((key) => {
      if (props[key] == null) return '';
      return `${key}=${encodeURIComponent(props[key])}`;
    })
    .join('&');
}

function boolToBinary(props) {
  let p = { ...props };
  for (let key in p) {
    if (p[key] === false) p[key] = 0;
    else if (p[key] === true) p[key] = 1;
  }
  return p;
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
