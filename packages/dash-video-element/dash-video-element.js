import { SuperVideoElement } from 'super-media-element';
import * as Dash from 'dashjs-esm';

class DashVideoElement extends SuperVideoElement {

  // Prevent forwarding src to native video element.
  static skipAttributes = ['src'];

  // No load promise needed because dash.js is sync.
  loadComplete = null;

  #apiInit;

  async load() {

    if (!this.#apiInit) {
      this.#apiInit = true;

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
