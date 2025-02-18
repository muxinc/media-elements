import { CustomVideoElement } from 'custom-media-element';

class DashVideoElement extends CustomVideoElement {
  static shadowRootOptions = { ...CustomVideoElement.shadowRootOptions };

  static getTemplateHTML = (attrs) => {
    const { src, ...rest } = attrs; // eslint-disable-line no-unused-vars
    return CustomVideoElement.getTemplateHTML(rest);
  };

  #apiInit;

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName !== 'src') {
      super.attributeChangedCallback(attrName, oldValue, newValue);
    }

    if (attrName === 'src' && oldValue != newValue) {
      this.load();
    }
  }

  async load() {

    if (!this.#apiInit) {
      this.#apiInit = true;

      const Dash = await import('dashjs');

      this.api = Dash.MediaPlayer().create();
      this.api.initialize(this.nativeEl, this.src, this.autoplay);

    } else {

      this.api.attachSource(this.src);
    }
  }
}

if (globalThis.customElements && !globalThis.customElements.get('dash-video')) {
  globalThis.customElements.define('dash-video', DashVideoElement);
}

export default DashVideoElement;
