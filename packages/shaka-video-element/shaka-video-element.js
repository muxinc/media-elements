import { CustomVideoElement } from 'custom-media-element';
import shaka from 'shaka-player';

function onErrorEvent(event) {
  // Extract the shaka.util.Error object from the event.
  onError(event.detail);
}

function onError(error) {
  // Log the error.
  console.error('Error code', error.code, 'object', error);
}

class ShakaVideoElement extends CustomVideoElement {
  static shadowRootOptions = { ...CustomVideoElement.shadowRootOptions };

  static getTemplateHTML = (attrs) => {
    const { src, ...rest } = attrs; // eslint-disable-line no-unused-vars
    return CustomVideoElement.getTemplateHTML(rest);
  };

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

  async load() {
    if (!this.api) return;

    // Wait 1 tick to allow other attributes to be set.
    await Promise.resolve();

    await this.api.attach(this.nativeEl);

    if (!this.src) {
      this.api.unload();
    } else {
      // Try to load a manifest.
      // This is an asynchronous process.
      try {
        await this.api.load(this.src);
      } catch (e) {
        // onError is executed if the asynchronous load fails.
        onError(e);
      }
    }
  }
}

if (globalThis.customElements && !globalThis.customElements.get('shaka-video')) {
  globalThis.customElements.define('shaka-video', ShakaVideoElement);
}

export default ShakaVideoElement;
