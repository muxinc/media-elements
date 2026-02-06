# `<tiktok-video>`

[![NPM Version](https://img.shields.io/npm/v/tiktok-video-element?style=flat-square&color=informational)](https://www.npmjs.com/package/tiktok-video-element) 
[![NPM Downloads](https://img.shields.io/npm/dm/tiktok-video-element?style=flat-square&color=informational&label=npm)](https://www.npmjs.com/package/tiktok-video-element) 
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/tiktok-video-element?style=flat-square&color=%23FF5627)](https://www.jsdelivr.com/package/npm/tiktok-video-element)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/tiktok-video-element?style=flat-square&color=success&label=gzip)](https://bundlephobia.com/result?p=tiktok-video-element) 

A [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
for the TikTok player with an API that matches the 
[`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) API.

- 🏄‍♂️ Compatible [`HTMLMediaElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) API
- 🕺 Seamlessly integrates with [Media Chrome](https://github.com/muxinc/media-chrome)

## Example

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/tiktok-video-element@0"></script>
<tiktok-video controls src="https://www.tiktok.com/@wesbos/video/6718335390845095173"></tiktok-video>
```

## Installing

`<tiktok-video>` is packaged as a javascript module (es6) only, which is supported by all evergreen browsers and Node v12+.

### Loading into your HTML using `<script>`

Note the `type="module"`, that's important.

> Modules are always loaded asynchronously by the browser, so it's ok to load them in the head :thumbsup:, and best for registering web components quickly.

```html
<head>
  <script type="module" src="https://cdn.jsdelivr.net/npm/tiktok-video-element@0"></script>
</head>
```

### Adding to your app via `npm`

```bash
npm install tiktok-video-element --save
```
Or yarn
```bash
yarn add tiktok-video-element
```

Include in your app javascript (e.g. src/App.js)
```js
import 'tiktok-video-element';
```
This will register the custom elements with the browser so they can be used as HTML.


## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player web component.
- [`<vimeo-video>`](https://github.com/muxinc/media-elements/tree/main/packages/vimeo-video-element) A web component for the Vimeo player.
- [`<videojs-video>`](https://github.com/muxinc/media-elements/tree/main/packages/videojs-video-element) A web component for Video.js.
- [`<wistia-video>`](https://github.com/muxinc/media-elements/tree/main/packages/wistia-video-element) A web component for the Wistia player.
- [`<jwplayer-video>`](https://github.com/muxinc/media-elements/tree/main/packages/jwplayer-video-element) A web component for the JW player.
- [`<hls-video>`](https://github.com/muxinc/media-elements/tree/main/packages/hls-video-element) A web component for playing HTTP Live Streaming (HLS) videos.
- [`castable-video`](https://github.com/muxinc/media-elements/tree/main/packages/castable-video) Cast your video element to the big screen with ease!
