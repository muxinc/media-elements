import { CustomVideoElement } from 'custom-media-element';
import { MediaTracksMixin } from 'media-tracks';
import './server-safe-globals.js';
import shaka from 'shaka-player';

function onErrorEvent(event) {
  // Extract the shaka.util.Error object from the event.
  onError(event.detail);
}

function onError(error) {
  // Log the error.
  console.error('Error code', error.code, 'object', error);
}

class ShakaVideoElement extends MediaTracksMixin(CustomVideoElement) {
  static shadowRootOptions = { ...CustomVideoElement.shadowRootOptions };

  static getTemplateHTML = (attrs) => {
    const { src, ...rest } = attrs; // eslint-disable-line no-unused-vars
    return CustomVideoElement.getTemplateHTML(rest);
  };

  #hasTracksInit = false;

  constructor() {
    super();

    if (shaka.Player.isBrowserSupported()) {
      this.api = new shaka.Player();
      // Listen for error events.
      this.api.addEventListener('error', onErrorEvent);
    } else {
      // This browser does not have the minimum set of APIs we need.
      console.error('Browser does not support Shaka Player');
    }
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName !== 'src') {
      super.attributeChangedCallback(attrName, oldValue, newValue);
    }

    if (attrName === 'src' && oldValue != newValue) {
      this.load();
    }
  }

  get src() {
    // Use the attribute value as the source of truth.
    // No need to store it in two places.
    // This avoids needing a to read the attribute initially and update the src.
    return this.getAttribute('src');
  }

  set src(val) {
    // If being set by attributeChangedCallback,
    // dont' cause an infinite loop
    if (val !== this.src) {
      this.setAttribute('src', val);
    }
  }

  #removeAllMediaTracks = () => {
    for (const videoTrack of this.videoTracks) {
      this.removeVideoTrack(videoTrack);
    }
    for (const audioTrack of this.audioTracks) {
      this.removeAudioTrack(audioTrack);
    }
  };

  #addMediaTracks() {
    this.#removeAllMediaTracks();
    
    const variantTracks = this.api.getVariantTracks();

    let videoTrack = this.videoTracks.getTrackById('main');
    if (!videoTrack) {
      videoTrack = this.addVideoTrack('main');
      videoTrack.id = 'main';
      videoTrack.selected = true;
    }

    // Deduplicate variants by video properties since Shaka returns one
    // entry per audio+video combination.
    const seen = new Set();
    for (const [index, variant] of variantTracks.entries()) {
      if (!variant.width && !variant.height) continue;
      const key = `${variant.width}x${variant.height}@${variant.videoBandwidth ?? variant.bandwidth}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const rendition = videoTrack.addRendition(
        variant.originalVideoId ?? `${variant.id}`,
        variant.width,
        variant.height,
        variant.videoCodec,
        variant.videoBandwidth ?? variant.bandwidth
      );
      rendition.id = `${index}`;
      rendition.label = `${variant.height}p`;
    }

    // Set up audio tracks.
    const audioLanguages = this.api.getAudioLanguagesAndRoles();
    for (let [id, audio] of audioLanguages.entries()) {
      const kind = id === 0 ? 'main' : 'alternative';
      const audioTrack = this.addAudioTrack(kind, audio.language, audio.language);
      audioTrack.id = `${id}`;
      if (id === 0) {
        audioTrack.enabled = true;
      }
    }
  }

  #initTracksListeners() {
    if (this.#hasTracksInit) return;
    this.#hasTracksInit = true;

    const switchRendition = () => {
      const selectedIndex = this.videoRenditions.selectedIndex;

      if (selectedIndex >= 0) {
        const variantTracks = this.api.getVariantTracks();
        const variantTrack = variantTracks[selectedIndex];
        if (variantTrack) {
          this.api.configure({ abr: { enabled: false } });
          this.api.selectVariantTrack(variantTrack, true);
        }
      } else {
        this.api.configure({ abr: { enabled: true } });
      }
    };

    this.videoRenditions?.addEventListener('change', switchRendition);

    this.audioTracks.addEventListener('change', () => {
      const enabledTrack = [...this.audioTracks].find((t) => t.enabled);
      if (enabledTrack) {
        const audioLanguages = this.api.getAudioLanguagesAndRoles();
        const audio = audioLanguages[+enabledTrack.id];
        if (audio) {
          this.api.selectAudioLanguage(audio.language, audio.role);
        }
      }
    });

    this.api.addEventListener('trackschanged', () => {
      const videoTrack = this.videoTracks[this.videoTracks.selectedIndex ?? 0];
      if (!videoTrack) return;

      const variantTracks = this.api.getVariantTracks();
      const variantIds = variantTracks.map((_, i) => `${i}`);

      for (const rendition of this.videoRenditions) {
        if (rendition.id && !variantIds.includes(rendition.id)) {
          videoTrack.removeRendition(rendition);
        }
      }
    });
  }

  async load() {
    if (!this.api) return;

    // Wait 1 tick to allow other attributes to be set.
    await Promise.resolve();

    await this.api.attach(this.nativeEl);

    if (!this.src) {
      this.#removeAllMediaTracks();
      this.api.unload();
    } else {
      // Try to load a manifest.
      // This is an asynchronous process.
      try {
        await this.api.load(this.src);
      } catch (e) {
        // onError is executed if the asynchronous load fails.
        onError(e);
        return;
      }

      // If the video is set to autoplay, start playback.
      if (this.nativeEl.autoplay && this.nativeEl.paused) {
        this.nativeEl.play().catch((err) => {
          console.warn('Autoplay failed:', err);
        });
      }

      this.#addMediaTracks();
      this.#initTracksListeners();
    }
  }
}

if (globalThis.customElements && !globalThis.customElements.get('shaka-video')) {
  globalThis.customElements.define('shaka-video', ShakaVideoElement);
}

export default ShakaVideoElement;
