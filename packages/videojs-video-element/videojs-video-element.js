// https://docs.videojs.com/
import { SuperVideoElement } from 'super-media-element';
import { MediaTracksMixin } from 'media-tracks';

const templateShadowDOM = globalThis.document?.createElement('template');
if (templateShadowDOM) {
  templateShadowDOM.innerHTML = /*html*/ `
  <style>
    :host {
      display: inline-block;
      min-width: 300px;
      min-height: 150px;
      position: relative;
    }
    video {
      max-width: 100%;
      max-height: 100%;
      min-width: 100%;
      min-height: 100%;
    }
    div.video-js {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
    }
  </style>
  <slot name="video">
    <video></video>
  </slot>
  <slot></slot>
  `;
}

class VideojsVideoElement extends (MediaTracksMixin?.(SuperVideoElement ?? class {}) ?? class {}) {
  static template = templateShadowDOM;
  static skipAttributes = ['src', 'controls', 'poster'];
  static get observedAttributes() {
    return [...SuperVideoElement.observedAttributes, 'stylesheet'];
  }

  #apiInit;

  get nativeEl() {
    return this.querySelector(':scope > [slot=video]') ?? this.shadowRoot.querySelector('video');
  }

  async load() {
    const options = {
      autoplay: this.autoplay,
      preload: this.preload ?? 'metadata',
      playsinline: this.playsInline,
      controls: this.controls,
      muted: this.defaultMuted,
      loop: this.loop,
      html5: {
        nativeTextTracks: true,
      },
    };

    if (!this.controls) {
      // If controls are disabled remove all children but the media loader.
      options.children = ['mediaLoader'];
    }

    if (!this.#apiInit) {
      this.#apiInit = true;

      const video = this.nativeEl;
      video.classList.add('video-js', ...this.classList);

      // You can load the videojs script ahead of time if you like,
      // if it's not there we'll laaaaaaaaaaaazy load it.
      let videojs = globalThis.videojs;
      if (!videojs) {
        const scriptUrl = `https://cdn.jsdelivr.net/npm/video.js@${this.version}/dist/video.min.js`;
        videojs = await loadScript(scriptUrl, 'videojs');
      }

      this.api = videojs(video, options);
      if (this.src) this.api.src(this.src);

      // Set up tracks & renditions

      this.api.audioTracks().on('addtrack', ({ track }) => {
        if (this.audioTracks.getTrackById(track.id)) return;

        const audioTrack = this.addAudioTrack(track.kind, track.label, track.language);
        audioTrack.id = `${track.id}`;
        audioTrack.enabled = track.enabled;
      });

      this.api.audioTracks().on('removetrack', ({ track }) => {
        const audioTrack = this.audioTracks.getTrackById(track.id);
        if (audioTrack) this.removeAudioTrack(audioTrack);
      });

      this.audioTracks.addEventListener('change', () => {
        const audioTracks = this.api.audioTracks();

        for (let i = 0; i < audioTracks.length; i++) {
          const audioTrack = audioTracks[i];
          audioTrack.enabled = this.audioTracks.getTrackById(audioTrack.id).enabled;
        }
      });

      const qualityLevels = this.api.qualityLevels();

      qualityLevels.on('addqualitylevel', (event) => {
        let videoTrack = this.videoTracks[0];

        if (!videoTrack) {
          videoTrack = this.addVideoTrack('main');
          videoTrack.selected = true;
        }

        const qualityLevel = event.qualityLevel;
        const videoRendition = videoTrack.addRendition(
          qualityLevel.id,
          qualityLevel.width,
          qualityLevel.height,
          undefined,
          qualityLevel.bitrate
        );
        videoRendition.id = `${qualityLevel.id}`;
      });

      const switchRendition = ({ target: renditions }) => {
        const isAuto = renditions.selectedIndex === -1;

        for (let rendition of renditions) {
          const qualityLevel = qualityLevels.getQualityLevelById(rendition.id);
          qualityLevel.enabled = isAuto || rendition.selected;
        }
      };

      this.videoRenditions.addEventListener('change', switchRendition);

      const removeAllMediaTracks = () => {
        for (const videoTrack of this.videoTracks) {
          this.removeVideoTrack(videoTrack);
        }
        for (const audioTrack of this.audioTracks) {
          this.removeAudioTrack(audioTrack);
        }
      };

      this.api.on('emptied', removeAllMediaTracks);
      this.api.on('loadstart', removeAllMediaTracks);
    } else {
      this.api.src(this.src);
    }

    this.api.ready(() => {
      this.loadComplete.resolve();
    });
  }

  connectedCallback() {
    super.connectedCallback();

    if (this.querySelector('source')) {
      this.load();
    }

    if (this.controls) {
      // Don't bother loading any stylesheets with controls disabled.
      const link = createElement('link', {
        href: `https://cdn.jsdelivr.net/npm/video.js@${this.version}/dist/video-js.min.css`,
        rel: 'stylesheet',
        crossorigin: '',
      });
      this.shadowRoot.prepend(link);

      // There is a bug? in Chrome and Firefox where @font-face doesn't work in shadow dom.
      // Appending it in the document fixes the missing font icon issue.
      link.onload = () => {
        [...this.shadowRoot.styleSheets[0].cssRules]
          .filter(({ cssText }) => cssText.startsWith('@font-face'))
          .forEach(({ cssText }) => {
            document.head.append(createElement('style', {}, cssText));
          });
      };
    }
  }

  async attributeChangedCallback(attr, oldValue, newValue) {
    // This is required to come before the await for resolving loadComplete.

    if (attr === 'stylesheet') {
      this.shadowRoot.querySelector('#stylesheet')?.remove();

      if (newValue) {
        this.shadowRoot.prepend(
          createElement('link', {
            id: 'stylesheet',
            href: newValue,
            rel: 'stylesheet',
            crossorigin: '',
          })
        );
      }
      return;
    }

    if (attr === 'controls') {
      await this.loadComplete;
      this.api.controls(newValue != null);
      return;
    }

    if (attr === 'poster') {
      await this.loadComplete;
      this.api.poster(newValue);
      return;
    }

    super.attributeChangedCallback(attr, oldValue, newValue);
  }

  // Override all methods for video.js so it calls its API directly.

  call(name, ...args) {
    return this.api?.[name]?.(...args);
  }

  get(prop) {
    // Some props are acting weird in videojs, get it straight from the video.
    return this.nativeEl?.[prop];
  }

  set(prop, val) {
    this.api?.[prop]?.(val);
  }

  get version() {
    return this.getAttribute('version') ?? '8';
  }
}

const loadScriptCache = {};
async function loadScript(src, globalName) {
  if (!globalName) return import(/* webpackIgnore: true */ src);
  if (loadScriptCache[src]) return loadScriptCache[src];
  if (self[globalName]) return self[globalName];
  return (loadScriptCache[src] = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.defer = true;
    script.src = src;
    script.onload = () => resolve(self[globalName]);
    script.onerror = reject;
    document.head.append(script);
  }));
}

function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.keys(attrs).forEach((name) => attrs[name] != null && el.setAttribute(name, attrs[name]));
  el.append(...children);
  return el;
}

if (globalThis.customElements && !globalThis.customElements.get('videojs-video')) {
  globalThis.customElements.define('videojs-video', VideojsVideoElement);
}

export default VideojsVideoElement;
