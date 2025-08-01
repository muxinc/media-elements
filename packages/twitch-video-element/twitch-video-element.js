// https://dev.twitch.tv/docs/embed/video-and-clips/

const EMBED_BASE = 'https://player.twitch.tv';
const MATCH_VIDEO = /(?:www\.|go\.)?twitch\.tv\/(?:videos?\/|\?video=)(\d+)($|\?)/;
const MATCH_CHANNEL = /(?:www\.|go\.)?twitch\.tv\/([a-zA-Z0-9_]+)($|\?)/;

const PlaybackState = {
  IDLE: 'Idle',
  READY: 'Ready',
  BUFFERING: 'Buffering',
  PLAYING: 'Playing',
  ENDED: 'Ended',
};

const PlayerCommands = {
  DISABLE_CAPTIONS: 0,
  ENABLE_CAPTIONS: 1,
  PAUSE: 2,
  PLAY: 3,
  SEEK: 4,
  SET_CHANNEL: 5,
  SET_CHANNEL_ID: 6,
  SET_COLLECTION: 7,
  SET_QUALITY: 8,
  SET_VIDEO: 9,
  SET_MUTED: 10,
  SET_VOLUME: 11,
};

function getTemplateHTML(attrs, props = {}) {
  const iframeAttrs = {
    src: serializeIframeUrl(attrs, props),
    frameborder: '0',
    width: '100%',
    height: '100%',
    allow: 'accelerometer; fullscreen; autoplay; encrypted-media; picture-in-picture;',
    sandbox: 'allow-modals allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox',
    scrolling: 'no',
  };

  if (props.config) {
    iframeAttrs['data-config'] = JSON.stringify(props.config);
  }

  return /*html*/ `
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
        width: 100%;
        height: 100%;
      }
      :host(:not([controls])) {
        pointer-events: none;
      }
    </style>
    <iframe${serializeAttributes(iframeAttrs)}></iframe>
  `;
}

function serializeIframeUrl(attrs, props) {
  if (!attrs.src) return;

  const videoMatch = attrs.src.match(MATCH_VIDEO);
  const channelMatch = attrs.src.match(MATCH_CHANNEL);

  const params = {
    parent: globalThis.location?.hostname,
    // ?controls=true is enabled by default in the iframe
    controls: attrs.controls === '' ? null : false,
    autoplay: attrs.autoplay === '' ? null : false,
    muted: attrs.muted,
    preload: attrs.preload,
    ...props.config,
  };

  if (videoMatch) {
    // Handle Twitch VODs
    const videoId = videoMatch[1];
    return `${EMBED_BASE}/?video=v${videoId}&${serialize(params)}`;
  } else if (channelMatch) {
    // Handle Twitch channels/live streams
    const channel = channelMatch[1];
    return `${EMBED_BASE}/?channel=${channel}&${serialize(params)}`;
  }

  return '';
}

class TwitchVideoElement extends (globalThis.HTMLElement ?? class {}) {
  static getTemplateHTML = getTemplateHTML;
  static shadowRootOptions = { mode: 'open' };
  static observedAttributes = ['autoplay', 'controls', 'loop', 'muted', 'playsinline', 'preload', 'src'];

  loadComplete = new PublicPromise();
  #loadRequested;
  #hasLoaded;
  #iframe;
  #playerState = {};
  #currentTime = 0;
  #muted = false;
  #volume = 1;
  #paused = !this.autoplay;
  #seeking = false;
  #readyState = 0;
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
    }
    this.#hasLoaded = true;
    
    // Wait 1 tick to allow other attributes to be set.
    await (this.#loadRequested = Promise.resolve());
    this.#loadRequested = null;
    
    this.#readyState = 0;
    this.dispatchEvent(new Event('emptied'));
    
    if (!this.src) {
      // Removes the <iframe> containing the player.
      this.shadowRoot.innerHTML = '';
      globalThis.removeEventListener('message', this.#onMessage);
      return;
    }
    
    this.dispatchEvent(new Event('loadstart'));
    
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

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (oldValue === newValue) return;

    // This is required to come before the await for resolving loadComplete.
    switch (attrName) {
      case 'src':
      case 'controls': {
        this.load();
        break;
      }
    }
  }

  get hlsLatencyBroadcaster() {
    return this.#playerState.stats.videoStats.hlsLatencyBroadcaster;
  }

  get src() {
    return this.getAttribute('src');
  }

  set src(value) {
    this.setAttribute('src', value);
  }

  get readyState() {
    return this.#readyState;
  }

  get seeking() {
    return this.#seeking;
  }

  get buffered() {
    return createTimeRanges(0, this.#playerState.stats?.videoStats?.bufferSize ?? 0);
  }

  get paused() {
    if (!this.#playerState.playback) return this.#paused;
    return this.#playerState.playback === PlaybackState.IDLE;
  }

  get ended() {
    if (!this.#playerState.playback) return false;
    return this.#playerState.playback === PlaybackState.ENDED;
  }

  get duration() {
    return this.#playerState.duration ?? NaN;
  }

  get autoplay() {
    return this.hasAttribute('autoplay');
  }

  set autoplay(val) {
    if (this.autoplay == val) return;
    this.toggleAttribute('autoplay', Boolean(val));
  }

  get controls() {
    return this.hasAttribute('controls');
  }

  set controls(val) {
    if (this.controls == val) return;
    this.toggleAttribute('controls', Boolean(val));
  }

  get currentTime() {
    if (!this.#playerState.currentTime) return this.#currentTime;
    return this.#playerState.currentTime;
  }

  set currentTime(val) {
    this.#currentTime = val;
    this.loadComplete.then(() => {
      this.#sendCommand(PlayerCommands.SEEK, val);
    });
  }

  get defaultMuted() {
    return this.hasAttribute('muted');
  }

  set defaultMuted(val) {
    this.toggleAttribute('muted', Boolean(val));
  }

  get loop() {
    return this.hasAttribute('loop');
  }

  set loop(val) {
    this.toggleAttribute('loop', Boolean(val));
  }

  get muted() {
    return this.#muted;
  }

  set muted(val) {
    this.#muted = val;
    this.loadComplete.then(() => {
      this.#sendCommand(PlayerCommands.SET_MUTED, val);
    });
  }

  get volume() {
    return this.#volume;
  }

  set volume(val) {
    this.#volume = val;
    this.loadComplete.then(() => {
      this.#sendCommand(PlayerCommands.SET_VOLUME, val);
    });
  }

  get playsInline() {
    return this.hasAttribute('playsinline');
  }

  set playsInline(val) {
    this.toggleAttribute('playsinline', Boolean(val));
  }

  play() {
    this.#paused = false;
    this.#sendCommand(PlayerCommands.PLAY);
  }

  pause() {
    this.#paused = true;
    this.#sendCommand(PlayerCommands.PAUSE);
  }

  #onMessage = async (event) => {
    if (!this.#iframe.contentWindow) return;

    const { data, source } = event;
    const isFromEmbedWindow = source === this.#iframe.contentWindow;
    if (!isFromEmbedWindow) return;

    if (data.namespace === 'twitch-embed') {
      // Give some time for the player state to be updated.
      await new Promise((resolve) => setTimeout(resolve, 10));

      if (data.eventName === 'ready') {
        this.dispatchEvent(new Event('loadcomplete'));
        this.loadComplete.resolve();

        this.#readyState = 1; // HTMLMediaElement.HAVE_METADATA
        this.dispatchEvent(new Event('loadedmetadata'));
      } else if (data.eventName === 'seek') {
        this.#seeking = true;
        this.dispatchEvent(new Event('seeking'));
      } else if (data.eventName === 'playing') {
        if (this.#seeking) {
          this.#seeking = false;
          this.dispatchEvent(new Event('seeked'));
        }
        this.#readyState = 3; // HTMLMediaElement.HAVE_FUTURE_DATA
        this.dispatchEvent(new Event('playing'));
      } else {
        this.dispatchEvent(new Event(data.eventName));
      }
    } else if (data.namespace === 'twitch-embed-player-proxy' && data.eventName === 'UPDATE_STATE') {
      const oldDuration = this.#playerState.duration;
      const oldCurrentTime = this.#playerState.currentTime;
      const oldVolume = this.#playerState.volume;
      const oldMuted = this.#playerState.muted;
      const oldBuffered = this.#playerState.stats?.videoStats?.bufferSize;

      this.#playerState = { ...this.#playerState, ...data.params };

      if (oldDuration !== this.#playerState.duration) {
        this.dispatchEvent(new Event('durationchange'));
      }

      if (oldCurrentTime !== this.#playerState.currentTime) {
        this.dispatchEvent(new Event('timeupdate'));
      }

      if (oldVolume !== this.#playerState.volume || oldMuted !== this.#playerState.muted) {
        this.dispatchEvent(new Event('volumechange'));
      }

      if (oldBuffered !== this.#playerState.stats?.videoStats?.bufferSize) {
        this.dispatchEvent(new Event('progress'));
      }
    }
  };

  #sendCommand(command, params) {
    if (!this.#iframe.contentWindow) return;

    const message = {
      eventName: command,
      params: params,
      namespace: 'twitch-embed-player-proxy',
    };

    this.#iframe.contentWindow.postMessage(message, EMBED_BASE);
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

// Helper functions
function namedNodeMapToObject(namedNodeMap) {
  let obj = {};
  for (let attr of namedNodeMap) {
    obj[attr.name] = attr.value;
  }
  return obj;
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
  return String(new URLSearchParams(filterParams(props)));
}

function filterParams(props) {
  let p = {};
  for (let key in props) {
    let val = props[key];
    if (val === true || val === '') p[key] = true;
    else if (val === false) p[key] = false;
    else if (val != null) p[key] = val;
  }
  return p;
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
      value: (i) => ranges[i][0],
    },
    end: {
      value: (i) => ranges[i][1],
    },
  });
  return ranges;
}

// Register the custom element
if (globalThis.customElements && !globalThis.customElements.get('twitch-video')) {
  globalThis.customElements.define('twitch-video', TwitchVideoElement);
}

export default TwitchVideoElement;
