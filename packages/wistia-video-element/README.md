# `<wistia-video>` 

[![NPM Version](https://img.shields.io/npm/v/wistia-video-element?style=flat-square&color=informational)](https://www.npmjs.com/package/wistia-video-element) 
[![NPM Downloads](https://img.shields.io/npm/dm/wistia-video-element?style=flat-square&color=informational&label=npm)](https://www.npmjs.com/package/wistia-video-element) 
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/wistia-video-element?style=flat-square&color=%23FF5627)](https://www.jsdelivr.com/package/npm/wistia-video-element)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/wistia-video-element?style=flat-square&color=success&label=gzip)](https://bundlephobia.com/result?p=wistia-video-element) 

A [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) 
for the Wistia player with an API that matches the 
[`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) API.

- 🏄‍♂️ Compatible [`HTMLMediaElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) API
- 🕺 Seamlessly integrates with [Media Chrome](https://github.com/muxinc/media-chrome)


## Example ([CodeSandbox](https://codesandbox.io/s/wistia-video-element-ozylhs))

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/wistia-video-element@1.0/+esm"></script>
<wistia-video controls src="https://wesleyluyten.wistia.com/medias/oifkgmxnkb"></wistia-video>
```

## Installing

First install the NPM package:

```bash
npm install wistia-video-element
```

Import in your app javascript (e.g. src/App.js):

```js
import 'wistia-video-element';
```

Optionally, you can load the script directly from a CDN using [JSDelivr](https://www.jsdelivr.com/):

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/wistia-video-element@1.0/+esm"></script>
```

This will register the custom elements with the browser so they can be used as HTML.

## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<youtube-video>`](https://github.com/muxinc/media-elements/tree/main/packages/youtube-video-element) A custom element for the YouTube player.
- [`<vimeo-video>`](https://github.com/muxinc/media-elements/tree/main/packages/vimeo-video-element) A custom element for the Vimeo player.
- [`<spotify-audio>`](https://github.com/muxinc/media-elements/tree/main/packages/spotify-audio-element) A custom element for the Spotify player.
- [`<jwplayer-video>`](https://github.com/muxinc/media-elements/tree/main/packages/jwplayer-video-element) A custom element for the JW player.
- [`<videojs-video>`](https://github.com/muxinc/media-elements/tree/main/packages/videojs-video-element) A custom element for Video.js.
- [`<cloudflare-video>`](https://github.com/muxinc/media-elements/tree/main/packages/cloudflare-video-element) A custom element for the Cloudflare player.
- [`<hls-video>`](https://github.com/muxinc/media-elements/tree/main/packages/hls-video-element) A custom element for playing HTTP Live Streaming (HLS) videos.
- [`castable-video`](https://github.com/muxinc/media-elements/tree/main/packages/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player custom element.
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
