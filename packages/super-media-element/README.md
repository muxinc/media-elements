# Super Media Element

[![NPM Version](https://img.shields.io/npm/v/super-media-element?style=flat-square&color=informational)](https://www.npmjs.com/package/super-media-element) 
[![NPM Downloads](https://img.shields.io/npm/dm/super-media-element?style=flat-square&color=informational&label=npm)](https://www.npmjs.com/package/super-media-element) 
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/super-media-element?style=flat-square&color=%23FF5627)](https://www.jsdelivr.com/package/npm/super-media-element)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/super-media-element?style=flat-square&color=success&label=gzip)](https://bundlephobia.com/result?p=super-media-element) 

A custom element that helps save alienated player API's in bringing back their true inner 
[HTMLMediaElement API](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement), 
or to extend a native media element like `<audio>` or `<video>`.

## Usage

```js
import { SuperVideoElement } from 'super-media-element';

class MyVideoElement extends SuperVideoElement {

  static observedAttributes = ['color', ...SuperVideoElement.observedAttributes];

  // Skip from forwarding the `src` attribute to the native element.
  static skipAttributes = ['src'];


  async attributeChangedCallback(attrName, oldValue, newValue) {
    
    if (attrName === 'color') {
      this.api.color = newValue;
    }

    super.attributeChangedCallback(attrName, oldValue, newValue);
  }

  async load() {
    // This is called when the `src` changes.
    
    // Load a video player from a script here.
    // Example: https://github.com/luwes/jwplayer-video-element/blob/main/jwplayer-video-element.js#L55-L75

    this.api = new VideoPlayer();
  }

  get nativeEl() {
    return this.querySelector('.loaded-video-element');
  }
}

if (!globalThis.customElements.get('my-video')) {
  globalThis.customElements.define('my-video', MyVideoElement);
}

export { MyVideoElement };
```


## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<youtube-video>`](https://github.com/muxinc/media-elements/tree/main/packages/youtube-video-element) A custom element for the YouTube player.
- [`<vimeo-video>`](https://github.com/muxinc/media-elements/tree/main/packages/vimeo-video-element) A custom element for the Vimeo player.
- [`<jwplayer-video>`](https://github.com/muxinc/media-elements/tree/main/packages/jwplayer-video-element) A custom element for the JW player.
- [`<wistia-video>`](https://github.com/muxinc/media-elements/tree/main/packages/wistia-video-element) A custom element for the Wistia player.
- [`<cloudflare-video>`](https://github.com/muxinc/media-elements/tree/main/packages/cloudflare-video-element) A custom element for the Cloudflare player.
- [`<videojs-video>`](https://github.com/muxinc/media-elements/tree/main/packages/videojs-video-element) A custom element for Video.js.
- [`<hls-video>`](https://github.com/muxinc/media-elements/tree/main/packages/hls-video-element) A custom element for playing HTTP Live Streaming (HLS) videos.
- [`castable-video`](https://github.com/muxinc/media-elements/tree/main/packages/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player custom element.
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
