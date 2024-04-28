# Super Media Element

[![Version](https://img.shields.io/npm/v/super-media-element?style=flat-square)](https://www.npmjs.com/package/super-media-element) 
[![Badge size](https://img.badgesize.io/https://cdn.jsdelivr.net/npm/super-media-element/+esm?compression=gzip&label=gzip&style=flat-square)](https://cdn.jsdelivr.net/npm/super-media-element/+esm)

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
- [`<youtube-video>`](https://github.com/muxinc/youtube-video-element) A custom element for the YouTube player.
- [`<vimeo-video>`](https://github.com/luwes/vimeo-video-element) A custom element for the Vimeo player.
- [`<jwplayer-video>`](https://github.com/luwes/jwplayer-video-element) A custom element for the JW player.
- [`<wistia-video>`](https://github.com/luwes/wistia-video-element) A custom element for the Wistia player.
- [`<cloudflare-video>`](https://github.com/luwes/cloudflare-video-element) A custom element for the Cloudflare player.
- [`<videojs-video>`](https://github.com/luwes/videojs-video-element) A custom element for Video.js.
- [`<hls-video>`](https://github.com/muxinc/hls-video-element) A custom element for playing HTTP Live Streaming (HLS) videos.
- [`castable-video`](https://github.com/muxinc/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player custom element.
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
