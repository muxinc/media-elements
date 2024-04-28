import { SuperVideoElement } from '../super-media-element.js';

class MyVideoElement extends SuperVideoElement {

  async load() {
    console.log('Loading...');

    // This shows that the video like API can be delayed for players like
    // YouTube, Vimeo, Wistia, any player that requires an async load.
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
  }
}

if (!globalThis.customElements.get('my-video')) {
  globalThis.customElements.define('my-video', MyVideoElement);
}

export default MyVideoElement;
