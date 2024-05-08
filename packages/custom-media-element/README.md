# Custom Media Element

[![NPM Version](https://img.shields.io/npm/v/custom-media-element?style=flat-square&color=informational)](https://www.npmjs.com/package/custom-media-element) 
[![NPM Downloads](https://img.shields.io/npm/dm/custom-media-element?style=flat-square&color=informational&label=npm)](https://www.npmjs.com/package/custom-media-element) 
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/custom-media-element?style=flat-square&color=%23FF5627)](https://www.jsdelivr.com/package/npm/custom-media-element)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/custom-media-element?style=flat-square&color=success&label=gzip)](https://bundlephobia.com/result?p=custom-media-element) 
[![Codecov](https://img.shields.io/codecov/c/github/muxinc/custom-media-element?style=flat-square)](https://app.codecov.io/gh/muxinc/custom-media-element)

A custom element for extending the native media elements (`<audio>` or `<video>`).


## Usage

```js
import { CustomVideoElement } from 'custom-media-element';

class MyCustomVideoElement extends CustomVideoElement {
  constructor() {
    super();
  }

  // Override the play method.
  play() {
    return super.play()
  }

  // Override the src getter & setter.
  get src() {
    return super.src;
  }

  set src(src) {
    super.src = src;
  }
}

if (globalThis.customElements && !globalThis.customElements.get('my-custom-video')) {
  globalThis.customElements.define('my-custom-video', MyCustomVideoElement);
}

export default MyCustomVideoElement;
```

```html
<my-custom-video
  src="https://stream.mux.com/A3VXy02VoUinw01pwyomEO3bHnG4P32xzV7u1j1FSzjNg/low.mp4"
></my-custom-video>
```


## Interfaces

```ts
export const Events: string[];

export const audioTemplate: HTMLTemplateElement;
export const videoTemplate: HTMLTemplateElement;

export class CustomAudioElement extends HTMLAudioElement implements HTMLAudioElement {
  static readonly observedAttributes: string[];
  static Events: string[];
  static template: HTMLTemplateElement;
  readonly nativeEl: HTMLAudioElement;
  attributeChangedCallback(attrName: string, oldValue?: string | null, newValue?: string | null): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  handleEvent(event: Event): void;
}

export class CustomVideoElement extends HTMLVideoElement implements HTMLVideoElement {
  static readonly observedAttributes: string[];
  static Events: string[];
  static template: HTMLTemplateElement;
  readonly nativeEl: HTMLVideoElement;
  attributeChangedCallback(attrName: string, oldValue?: string | null, newValue?: string | null): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  handleEvent(event: Event): void;
}

type CustomMediaElementConstructor<T> = {
  readonly observedAttributes: string[];
  Events: string[];
  template: HTMLTemplateElement;
  new(): T
};

export function CustomMediaMixin(superclass: any, options: { tag: 'video', is?: string }):
  CustomMediaElementConstructor<CustomVideoElement>;

export function CustomMediaMixin(superclass: any, options: { tag: 'audio', is?: string }):
  CustomMediaElementConstructor<CustomAudioElement>;
```


## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<hls-video>`](https://github.com/muxinc/media-elements/tree/main/packages/hls-video-element) A custom element for playing HTTP Live Streaming (HLS) videos.
- [`<youtube-video>`](https://github.com/muxinc/media-elements/tree/main/packages/youtube-video-element) A custom element for the YouTube player.
- [`<vimeo-video>`](https://github.com/muxinc/media-elements/tree/main/packages/vimeo-video-element) A custom element for the Vimeo player.
- [`<spotify-audio>`](https://github.com/muxinc/media-elements/tree/main/packages/spotify-audio-element) A custom element for the Spotify player.
- [`<jwplayer-video>`](https://github.com/muxinc/media-elements/tree/main/packages/jwplayer-video-element) A custom element for the JW player.
- [`<wistia-video>`](https://github.com/muxinc/media-elements/tree/main/packages/wistia-video-element) A custom element for the Wistia player.
- [`<cloudflare-video>`](https://github.com/muxinc/media-elements/tree/main/packages/cloudflare-video-element) A custom element for the Cloudflare player.
- [`<videojs-video>`](https://github.com/muxinc/media-elements/tree/main/packages/videojs-video-element) A custom element for Video.js.
- [`<castable-video>`](https://github.com/muxinc/media-elements/tree/main/packages/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player custom element.
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
