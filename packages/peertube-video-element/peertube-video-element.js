const EMBED_BASE = "/videos/embed";
const MATCH_SRC = /(https?):\/\/([^/]+)\/(?:videos\/watch|w)\/(.+)$/;

// SDK configuration
const SDK_URL = "https://unpkg.com/@peertube/embed-api/build/player.min.js";
const SDK_GLOBAL = "PeerTubePlayer";

export function canPlay(src) {
  return MATCH_SRC.test(src);
}

function getTemplateHTML(attrs, config) {
  const iframeAttrs = {
    src: serializeIframeUrl(attrs, config) || "",
    frameborder: 0,
    width: "100%",
    height: "100%",
    allow:
      "accelerometer; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture",
    sandbox: "allow-same-origin allow-scripts allow-popups",
  };

  if (config) {
    iframeAttrs["data-config"] = JSON.stringify(config);
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
      }
      :host(:not([controls])) {
        pointer-events: none;
      }
    </style>
    <iframe${serializeAttributes(iframeAttrs)}></iframe>
  `;
}

function serializeIframeUrl(attrs, config) {
  if (!attrs.src) return undefined;

  const matches = attrs.src.match(MATCH_SRC);
  if (!matches) return undefined;

  const protocol = matches[1];
  const domain = matches[2];
  const videoId = matches[3];

  const params = {
    api: 1,
    controls: attrs.controls === "" ? 1 : 0,
    autoplay: attrs.autoplay === "" ? 1 : 0,
    loop: attrs.loop === "" ? 1 : 0,
    muted: attrs.muted === "" ? 1 : 0,
    peertubeLink: 0,
    title: 0,
    warningTitle: 0,
    ...config,
  };

  return `${protocol}://${domain}${EMBED_BASE}/${videoId}?${serialize(params)}`;
}

// Store resolve functions for concurrent SDK loading attempts
const sdkResolves = {};

// Helper to access global SDK
function getGlobalSDK() {
  return window[SDK_GLOBAL];
}

function getSDK() {
  return new Promise((resolve, reject) => {
    // Check if SDK is already loaded
    const existingSDK = getGlobalSDK();
    if (existingSDK) {
      resolve(existingSDK);
      return;
    }

    // If we are already loading the SDK, add the resolve function to the array
    if (sdkResolves[SDK_URL]) {
      sdkResolves[SDK_URL].push(resolve);
      return;
    }
    sdkResolves[SDK_URL] = [resolve];

    // Check if script is already being loaded
    const existingScript = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        const sdk = getGlobalSDK();
        if (sdkResolves[SDK_URL]) {
          sdkResolves[SDK_URL].forEach((res) => res(sdk));
          delete sdkResolves[SDK_URL];
        }
      });
      existingScript.addEventListener("error", reject);
      return;
    }

    // Load the script
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => {
      const sdk = getGlobalSDK();
      sdkResolves[SDK_URL].forEach((res) => res(sdk));
      delete sdkResolves[SDK_URL];
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * A utility to create Promises with convenient public resolve and reject methods.
 */
class PublicPromise extends Promise {
  constructor(executor = () => void 0) {
    let res;
    let rej;
    super((resolve, reject) => {
      executor(resolve, reject);
      res = resolve;
      rej = reject;
    });
    this.resolve = res;
    this.reject = rej;
  }
}

class PeerTubeVideoElement extends HTMLElement {
  static getTemplateHTML = getTemplateHTML;
  static shadowRootOptions = { mode: "open" };
  static observedAttributes = [
    "autoplay",
    "controls",
    "crossorigin",
    "loop",
    "muted",
    "playsinline",
    "poster",
    "preload",
    "src",
  ];

  loadComplete = new PublicPromise();
  #loadRequested = null;
  #hasLoaded = false;
  #isInit = false;
  #currentTime = 0;
  #duration = NaN;
  #muted = false;
  #paused = true;
  #playbackRate = 1;
  #progress = 0;
  #readyState = 0;
  #seeking = false;
  #volume = 1;
  #volumeBeforeMute = 1;
  #videoWidth = NaN;
  #videoHeight = NaN;
  #config = null;

  api = null;
  textTracks = null;

  constructor() {
    super();
    this.#upgradeProperty("config");

    // Initialize paused based on autoplay attribute
    this.#paused = !this.autoplay;
  }

  /**
   * True only when we're in a browser, connected to DOM, and API is ready.
   * PeerTube SDK's Channel.build() throws if called without a valid window (e.g. SSR or before iframe ready).
   */
  #canUseApi() {
    return (
      typeof window !== "undefined" && this.isConnected && this.api != null
    );
  }

  connectedCallback() {
    // Auto-load when connected to DOM if src is present
    if (this.src && !this.#hasLoaded) {
      this.load();
    }
  }

  requestFullscreen() {
    // PeerTube doesn't expose fullscreen API directly, use iframe fullscreen
    const iframe = this.shadowRoot?.querySelector("iframe");
    return (
      iframe?.requestFullscreen() ??
      Promise.reject(new Error("No iframe found"))
    );
  }

  get config() {
    return this.#config;
  }

  set config(value) {
    this.#config = value;
  }

  async load() {
    if (this.#loadRequested) return;

    const isFirstLoad = !this.#hasLoaded;

    if (this.#hasLoaded) this.loadComplete = new PublicPromise();
    this.#hasLoaded = true;

    // Wait 1 tick to allow other attributes to be set.
    await (this.#loadRequested = Promise.resolve());
    this.#loadRequested = null;

    this.#currentTime = 0;
    this.#duration = NaN;
    this.#muted = this.defaultMuted;
    this.#paused = !this.autoplay;
    this.#playbackRate = 1;
    this.#progress = 0;
    this.#readyState = 0;
    this.#seeking = false;
    this.#volume = 1;
    this.#videoWidth = NaN;
    this.#videoHeight = NaN;
    this.dispatchEvent(new Event("emptied"));

    const oldApi = this.api;
    this.api = null;

    if (!this.src) {
      return;
    }

    this.dispatchEvent(new Event("loadstart"));

    const onLoaded = async () => {
      this.#readyState = 1; // HTMLMediaElement.HAVE_METADATA
      this.dispatchEvent(new Event("loadedmetadata"));

      if (this.api && typeof window !== "undefined") {
        try {
          // PeerTube doesn't have getMuted - infer from volume or defaultMuted attribute
          this.#volume = await this.api.getVolume();
          this.#muted = this.defaultMuted || this.#volume === 0;
          this.dispatchEvent(new Event("volumechange"));
        } catch {
          // Channel.build() can throw if iframe not ready; keep defaults
        }
      }

      this.dispatchEvent(new Event("loadcomplete"));
      this.loadComplete.resolve();
    };

    // If already initialized, we need to reload the iframe
    if (this.#isInit && oldApi) {
      // Destroy old player and reinitialize
      try {
        oldApi.destroy();
      } catch (_) {
        // Ignore destroy errors - player may already be destroyed
        void 0;
      }
      this.#isInit = false;
    }

    this.#isInit = true;

    let iframe = this.shadowRoot?.querySelector("iframe");

    if (isFirstLoad && iframe) {
      const configAttr = iframe.getAttribute("data-config");
      this.#config = configAttr ? JSON.parse(configAttr) : {};
    }

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = getTemplateHTML(
        namedNodeMapToObject(this.attributes),
        this.#config ?? undefined,
      );
      iframe = this.shadowRoot.querySelector("iframe");
    } else if (!iframe) {
      this.shadowRoot.innerHTML = getTemplateHTML(
        namedNodeMapToObject(this.attributes),
        this.#config ?? undefined,
      );
      iframe = this.shadowRoot.querySelector("iframe");
    } else {
      // Update iframe src
      const newSrc = serializeIframeUrl(
        namedNodeMapToObject(this.attributes),
        this.#config ?? undefined,
      );
      if (newSrc) {
        iframe.src = newSrc;
      }
    }

    if (!iframe) {
      this.loadComplete.reject(new Error("Failed to create iframe"));
      return;
    }

    try {
      const PeerTubePlayerConstructor = await getSDK();
      this.api = new PeerTubePlayerConstructor(iframe);

      await this.api.ready;

      // Set up event listeners
      this.api.addEventListener("playbackStatusUpdate", (data) => {
        const prevTime = this.#currentTime;
        this.#currentTime = data.position;

        if (data.duration && data.duration !== this.#duration) {
          this.#duration = data.duration;
          this.dispatchEvent(new Event("durationchange"));
        }

        if (prevTime !== this.#currentTime) {
          this.dispatchEvent(new Event("timeupdate"));
        }

        // Update progress (buffered)
        this.#progress = data.position;
        this.dispatchEvent(new Event("progress"));
      });

      this.api.addEventListener("playbackStatusChange", (status) => {
        if (status === "playing") {
          if (this.#paused) {
            this.#paused = false;
            this.dispatchEvent(new Event("play"));
          }
          this.#readyState = 3; // HTMLMediaElement.HAVE_FUTURE_DATA
          this.dispatchEvent(new Event("playing"));
        } else if (status === "paused") {
          this.#paused = true;
          this.dispatchEvent(new Event("pause"));
        } else if (status === "ended") {
          this.#paused = true;
          this.dispatchEvent(new Event("ended"));
        }
      });

      // Handle resolution change for video dimensions
      this.api.addEventListener("resolutionChange", (data) => {
        if (data.width) this.#videoWidth = data.width;
        if (data.height) this.#videoHeight = data.height;
        this.dispatchEvent(new Event("resize"));
      });

      await onLoaded();
    } catch (error) {
      this.loadComplete.reject(error);
      this.dispatchEvent(new ErrorEvent("error", { error }));
    }

    await this.loadComplete;
  }

  async attributeChangedCallback(attrName, oldValue, newValue) {
    if (oldValue === newValue) return;

    // These attributes trigger a reload
    switch (attrName) {
      case "autoplay":
      case "controls":
      case "src": {
        this.load();
        return;
      }
    }

    await this.loadComplete;

    switch (attrName) {
      case "loop": {
        // PeerTube doesn't have a setLoop method, handled via embed params
        break;
      }
      case "muted": {
        if (!this.#canUseApi()) break;
        try {
          if (this.defaultMuted) {
            this.#volumeBeforeMute = this.#volume || 1;
            this.api.setVolume(0).catch(() => void 0);
          } else {
            this.api.setVolume(this.#volumeBeforeMute).catch(() => void 0);
          }
        } catch {
          // PeerTube SDK can throw before iframe ready
        }
        break;
      }
    }
  }

  async play() {
    this.#paused = false;
    this.dispatchEvent(new Event("play"));

    await this.loadComplete;

    if (!this.#canUseApi()) return;
    try {
      await this.api.play();
    } catch (error) {
      this.#paused = true;
      this.dispatchEvent(new Event("pause"));
      throw error;
    }
  }

  async pause() {
    await this.loadComplete;
    if (!this.#canUseApi()) return;
    try {
      return await this.api.pause();
    } catch {
      return undefined;
    }
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
    return this.getAttribute("src");
  }

  set src(val) {
    if (this.src === val) return;
    if (val) {
      this.setAttribute("src", val);
    } else {
      this.removeAttribute("src");
    }
  }

  get paused() {
    return this.#paused;
  }

  get duration() {
    return this.#duration;
  }

  get autoplay() {
    return this.hasAttribute("autoplay");
  }

  set autoplay(val) {
    if (this.autoplay === val) return;
    this.toggleAttribute("autoplay", Boolean(val));
  }

  get seekable() {
    if (this.#duration > 0) {
      return createTimeRanges(0, this.#duration);
    }
    return createTimeRanges();
  }

  get buffered() {
    if (this.#progress > 0) {
      return createTimeRanges(0, this.#progress);
    }
    return createTimeRanges();
  }

  get controls() {
    return this.hasAttribute("controls");
  }

  set controls(val) {
    if (this.controls === val) return;
    this.toggleAttribute("controls", Boolean(val));
  }

  get currentTime() {
    return this.#currentTime;
  }

  set currentTime(val) {
    if (this.currentTime === val) return;
    this.#currentTime = val;
    this.#seeking = true;
    this.dispatchEvent(new Event("seeking"));

    this.loadComplete.then(() => {
      if (!this.#canUseApi()) {
        this.#seeking = false;
        return;
      }
      try {
        this.api.seek(val)
          .then(() => {
            this.#seeking = false;
            this.dispatchEvent(new Event("seeked"));
          })
          .catch(() => {
            this.#seeking = false;
            void 0;
          });
      } catch {
        this.#seeking = false;
      }
    });
  }

  get defaultMuted() {
    return this.hasAttribute("muted");
  }

  set defaultMuted(val) {
    if (this.defaultMuted === val) return;
    this.toggleAttribute("muted", Boolean(val));
  }

  get loop() {
    return this.hasAttribute("loop");
  }

  set loop(val) {
    if (this.loop === val) return;
    this.toggleAttribute("loop", Boolean(val));
  }

  get muted() {
    return this.#muted;
  }

  set muted(val) {
    if (this.muted === val) return;
    this.#muted = val;
    this.loadComplete.then(() => {
      if (!this.#canUseApi()) return;
      try {
        if (val) {
          this.#volumeBeforeMute = this.#volume || 1;
          this.api.setVolume(0).catch(() => void 0);
        } else {
          this.api.setVolume(this.#volumeBeforeMute).catch(() => void 0);
        }
      } catch {
        // PeerTube SDK can throw before iframe ready
      }
    });
    this.dispatchEvent(new Event("volumechange"));
  }

  get playbackRate() {
    return this.#playbackRate;
  }

  set playbackRate(val) {
    if (this.playbackRate === val) return;
    this.#playbackRate = val;
    this.loadComplete.then(() => {
      if (!this.#canUseApi()) return;
      try {
        this.api.setPlaybackRate(val).catch(() => void 0);
      } catch {
        // PeerTube SDK can throw before iframe ready
      }
    });
    this.dispatchEvent(new Event("ratechange"));
  }

  get playsInline() {
    return this.hasAttribute("playsinline");
  }

  set playsInline(val) {
    if (this.playsInline === val) return;
    this.toggleAttribute("playsinline", Boolean(val));
  }

  get poster() {
    return this.getAttribute("poster");
  }

  set poster(val) {
    if (this.poster === val) return;
    if (val) {
      this.setAttribute("poster", val);
    } else {
      this.removeAttribute("poster");
    }
  }

  get preload() {
    return this.getAttribute("preload");
  }

  set preload(val) {
    if (this.preload === val) return;
    if (val) {
      this.setAttribute("preload", val);
    } else {
      this.removeAttribute("preload");
    }
  }

  get volume() {
    return this.#volume;
  }

  set volume(val) {
    if (this.volume === val) return;
    this.#volume = val;
    this.loadComplete.then(() => {
      if (!this.#canUseApi()) return;
      try {
        this.api.setVolume(val).catch(() => void 0);
      } catch {
        // PeerTube SDK can throw "Channel.build() called without a valid window" e.g. before iframe ready
      }
    });
    this.dispatchEvent(new Event("volumechange"));
  }

  // https://web.dev/custom-elements-best-practices/#make-properties-lazy
  #upgradeProperty(prop) {
    if (Object.hasOwn(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }
}

function serializeAttributes(attrs) {
  let html = "";
  for (const key in attrs) {
    const value = attrs[key];
    if (value === "") html += ` ${escapeHtml(key)}`;
    else html += ` ${escapeHtml(key)}="${escapeHtml(`${value}`)}"`;
  }
  return html;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/`/g, "&#x60;");
}

function serialize(props) {
  return String(new URLSearchParams(boolToBinary(props)));
}

function boolToBinary(props) {
  const p = {};
  for (const key in props) {
    const val = props[key];
    if (val === true || val === "") p[key] = 1;
    else if (val === false) p[key] = 0;
    else if (val != null) p[key] = val;
  }
  return p;
}

function namedNodeMapToObject(namedNodeMap) {
  const obj = {};
  for (const attr of namedNodeMap) {
    obj[attr.name] = attr.value;
  }
  return obj;
}

/**
 * Creates a fake `TimeRanges` object.
 */
function createTimeRanges(start, end) {
  if (start == null || end == null || (start === 0 && end === 0)) {
    return createTimeRangesObj([[0, 0]]);
  }
  return createTimeRangesObj([[start, end]]);
}

function createTimeRangesObj(ranges) {
  return {
    length: ranges.length,
    start: (i) => ranges[i][0],
    end: (i) => ranges[i][1],
  };
}

if (globalThis.customElements && !globalThis.customElements.get('peertube-video')) {
  globalThis.customElements.define('peertube-video', PeerTubeVideoElement);
}

export default PeerTubeVideoElement;
