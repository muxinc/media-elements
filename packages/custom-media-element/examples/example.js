import { CustomVideoElement, CustomAudioElement } from '../custom-media-element.js';

export class MyVideoElement extends CustomVideoElement {}

if (globalThis.customElements && !globalThis.customElements.get('my-video')) {
  globalThis.customElements.define('my-video', MyVideoElement);
}

export class MyAudioElement extends CustomAudioElement {}

if (globalThis.customElements && !globalThis.customElements.get('my-audio')) {
  globalThis.customElements.define('my-audio', MyAudioElement);
}
