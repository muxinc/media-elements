import { MediaTracksMixin } from 'media-tracks';
import { MediaPlayedRangesMixin } from 'media-played-ranges-mixin';

const EMBED_BASE = "/videos/embed";
const MATCH_SRC = /(https?):\/\/([^/]+)\/(?:videos\/(?:watch|embed)|w)\/(.+)$/;

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
    ...(attrs.playbackrate ? { playbackRate: attrs.playbackrate } : {}),
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

class PeerTubeVideoElement extends MediaPlayedRangesMixin(MediaTracksMixin(globalThis.HTMLElement ?? class {})) {
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
  #currentTime = 0;
  #duration = NaN;
  #ended = false;
  #muted = false;
  #paused = true;
  #playRequested = false;
  #playbackRate = 1;
  #readyState = 0;
  #seeking = false;
  #volume = 1;
  #volumeBeforeMute = 1;
  #videoWidth = NaN;
  #videoHeight = NaN;
  #config = null;

  api = null;
  #error = null;
  #switchRendition = null;
  #onTextTracksChange = null;
  #textTracksEl = typeof document !== 'undefined' ? document.createElement('video') : null;
  textTracks = this.#textTracksEl?.textTracks ?? null;

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

  disconnectedCallback() {
    try { this.api?.destroy(); } catch (_) { void 0; }
    this.api = null;
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
    this.#ended = false;
    this.#error = null;
    this.#muted = this.defaultMuted;

    this.#paused = !this.autoplay;
    this.#playRequested = false;
    this.#playbackRate = 1;
    this.#readyState = 0;
    this.#seeking = false;
    this.#volume = 1;
    this.#volumeBeforeMute = 1;
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

    if (oldApi) {
      try { oldApi.destroy(); } catch (_) { void 0; }
    }

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

        // Sync volume from the update payload as a fallback for instances
        // that don't reliably fire the volumeChange event.
        if (data.volume != null && data.volume !== this.#volume) {
          this.#volume = data.volume;
          this.#muted = data.volume === 0;
          this.dispatchEvent(new Event("volumechange"));
        }

        const positionAdvanced = this.#currentTime !== prevTime;

        // Commit to "playing" only once the position is actually moving —
        // PeerTube fires "playing" while still buffering, so we gate here
        // to prevent Media Chrome from wall-clock estimating time during load.
        if (this.#playRequested && positionAdvanced) {
          this.#playRequested = false;
          if (this.#paused) {
            this.#paused = false;
            this.dispatchEvent(new Event("play"));
          }
          if (this.#readyState < 3) {
            this.#readyState = 3;
          }
          this.dispatchEvent(new Event("playing"));
        }

        if (positionAdvanced) {
          this.dispatchEvent(new Event("timeupdate"));
        }
      });

      this.api.addEventListener("playbackStatusChange", (status) => {
        if (status === "playing") {
          this.#ended = false;
          this.#playRequested = true;
        } else if (status === "paused") {
          this.#playRequested = false;
          this.#paused = true;
          this.dispatchEvent(new Event("pause"));
        } else if (status === "ended") {
          this.#playRequested = false;
          this.#paused = true;
          this.#ended = true;
          this.dispatchEvent(new Event("ended"));
        } else if (status === "unstarted") {
          this.#playRequested = false;
          this.#paused = true;
          this.#readyState = 0;
        }
      });

      // Renditions may not be available immediately after api.ready (the stream
      // hasn't buffered yet). Populate on first resolutionUpdate; after that only
      // update dimensions so we don't reset the user's selection.
      let renditionsPopulated = false;
      const onResolutionUpdate = async (data) => {
        if (data?.width) this.#videoWidth = data.width;
        if (data?.height) this.#videoHeight = data.height;
        if (data) this.dispatchEvent(new Event("resize"));

        if (renditionsPopulated) return;

        let resolutions;
        try {
          resolutions = await this.api.getResolutions();
        } catch (_) {
          return;
        }
        if (!resolutions?.length) return;
        renditionsPopulated = true;

        let videoTrack = this.videoTracks.getTrackById('main');
        if (!videoTrack) {
          videoTrack = this.addVideoTrack('main');
          videoTrack.id = 'main';
          videoTrack.selected = true;
        }
        for (const res of resolutions) {
          // Skip id:-1 (PeerTube's own auto entry) — Media Chrome adds its own Auto option.
          if (res.id === -1) continue;
          // height/width from PeerTube are strings ("720"), parseInt converts them.
          const height = parseInt(res.height) || parseInt(res.label) || undefined;
          const width = parseInt(res.width) || undefined;
          const rendition = videoTrack.addRendition(
            undefined, width, height, undefined, undefined,
          );
          rendition.id = `${res.id}`;
          rendition.label = res.label;
        }
      };

      // Try immediately in case resolutions are already available, then keep
      // listening for the first resolutionUpdate that carries real data.
      await onResolutionUpdate(null);
      this.api.addEventListener("resolutionUpdate", onResolutionUpdate);

      // Forward videoRenditions selection to PeerTube SDK.
      // setResolution(-1) = auto/ABR, only works in p2p-media-loader mode.
      // In web-video mode PeerTube throws — fall back to the first (highest) rendition.
      this.videoRenditions.removeEventListener('change', this.#switchRendition);
      this.#switchRendition = async () => {
        if (!this.#canUseApi()) return;
        const selected = [...this.videoRenditions].find((r) => r.selected);
        const resolutionId = selected ? Number(selected.id) : -1;
        try {
          await this.api.setResolution(resolutionId);
        } catch (_) {
          if (resolutionId === -1 && this.videoRenditions.length > 0) {
            // web-video mode: auto not supported, lock to the first (highest) rendition
            await this.api.setResolution(Number(this.videoRenditions[0].id)).catch(() => void 0);
          }
        }
      };
      this.videoRenditions.addEventListener('change', this.#switchRendition);

      // Sync volume/muted when user adjusts volume inside the PeerTube player UI
      this.api.addEventListener("volumeChange", (data) => {
        this.#volume = data.volume;
        this.#muted = data.volume === 0;
        this.dispatchEvent(new Event("volumechange"));
      });

      // Populate captions into the stable TextTrackList via <track> elements so
      // tracks can be fully removed on reload (addTextTrack() tracks are permanent).
      if (this.#textTracksEl) {
        this.#textTracksEl.innerHTML = '';
        try {
          const captions = await this.api.getCaptions();
          for (const caption of captions) {
            const trackEl = document.createElement('track');
            trackEl.kind = 'subtitles';
            trackEl.label = caption.label;
            trackEl.srclang = caption.id; // used in change handler to call setCaption(id)
            this.#textTracksEl.appendChild(trackEl);
          }
        } catch (_) {
          // getCaptions() throws when there are no captions — that's fine
        }
        this.textTracks.removeEventListener('change', this.#onTextTracksChange);
        this.#onTextTracksChange = () => {
          if (!this.#canUseApi()) return;
          const active = Array.from(this.textTracks).find((t) => t.mode === 'showing');
          this.api.setCaption(active?.language ?? null).catch(() => void 0);
        };
        this.textTracks.addEventListener('change', this.#onTextTracksChange);
      }

      await onLoaded();
    } catch (error) {
      this.#error = error;
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
      case "loop":
      case "src": {
        this.load();
        return;
      }
    }

    await this.loadComplete;

    switch (attrName) {
      case "muted": {
        const muted = this.defaultMuted;
        this.#muted = muted;
        if (this.#canUseApi()) {
          try {
            if (muted) {
              this.#volumeBeforeMute = this.#volume || 1;
              this.api.setVolume(0).catch(() => void 0);
            } else {
              this.api.setVolume(this.#volumeBeforeMute).catch(() => void 0);
            }
          } catch {
            // PeerTube SDK can throw before iframe ready
          }
        }
        this.dispatchEvent(new Event("volumechange"));
        break;
      }
    }
  }

  async play() {
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

  get error() {
    return this.#error;
  }

  get ended() {
    return this.#ended;
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
    if (val == undefined) return; // skip invalid values
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
  if (start == null || end == null) {
    return createTimeRangesObj([]);
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
