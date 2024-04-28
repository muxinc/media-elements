# Custom Media Element

[![Version](https://img.shields.io/npm/v/custom-media-element?style=flat-square)](https://www.npmjs.com/package/custom-media-element) 
[![Badge size](https://img.badgesize.io/https://cdn.jsdelivr.net/npm/custom-media-element/+esm?compression=gzip&label=gzip&style=flat-square)](https://cdn.jsdelivr.net/npm/custom-media-element/+esm)
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
- [`<hls-video>`](https://github.com/muxinc/hls-video-element) A custom element for playing HTTP Live Streaming (HLS) videos.
- [`<youtube-video>`](https://github.com/muxinc/youtube-video-element) A custom element for the YouTube player.
- [`<vimeo-video>`](https://github.com/luwes/vimeo-video-element) A custom element for the Vimeo player.
- [`<spotify-audio>`](https://github.com/luwes/spotify-audio-element) A custom element for the Spotify player.
- [`<jwplayer-video>`](https://github.com/luwes/jwplayer-video-element) A custom element for the JW player.
- [`<wistia-video>`](https://github.com/luwes/wistia-video-element) A custom element for the Wistia player.
- [`<cloudflare-video>`](https://github.com/luwes/cloudflare-video-element) A custom element for the Cloudflare player.
- [`<videojs-video>`](https://github.com/luwes/videojs-video-element) A custom element for Video.js.
- [`<castable-video>`](https://github.com/muxinc/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player custom element.
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
