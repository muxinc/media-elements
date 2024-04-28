# `<jwplayer-video>` 

[![NPM Version](https://img.shields.io/npm/v/jwplayer-video-element?style=flat-square&color=informational)](https://www.npmjs.com/package/jwplayer-video-element) 
[![NPM Downloads](https://img.shields.io/npm/dm/jwplayer-video-element?style=flat-square&color=informational&label=npm)](https://www.npmjs.com/package/jwplayer-video-element) 
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/jwplayer-video-element?style=flat-square&color=%23FF5627)](https://www.jsdelivr.com/package/npm/jwplayer-video-element)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/jwplayer-video-element?style=flat-square&color=success&label=gzip)](https://bundlephobia.com/result?p=jwplayer-video-element) 

A [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) 
for the JW player with an API that matches the 
[`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) API.

- 🏄‍♂️ Compatible [`HTMLMediaElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) API
- 🕺 Seamlessly integrates with [Media Chrome](https://github.com/muxinc/media-chrome)

## Example ([CodeSandbox](https://codesandbox.io/s/jwplayer-video-element-gm5qd1))

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/jwplayer-video-element@1.0/+esm"></script>
<jwplayer-video controls src="https://cdn.jwplayer.com/players/C8YE48zj-IxzuqJ4M.html"></jwplayer-video>
```

## Install

First install the NPM package:

```bash
npm install jwplayer-video-element
```

Import in your app javascript (e.g. src/App.js):

```js
import 'jwplayer-video-element';
```

Optionally, you can load the script directly from a CDN using [JSDelivr](https://www.jsdelivr.com/):

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/jwplayer-video-element@1.0/+esm"></script>
```

This will register the custom elements with the browser so they can be used as HTML.

## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<youtube-video>`](https://github.com/muxinc/youtube-video-element) A custom element for the YouTube player.
- [`<vimeo-video>`](https://github.com/luwes/vimeo-video-element) A custom element for the Vimeo player.
- [`<spotify-audio>`](https://github.com/luwes/spotify-audio-element) A custom element for the Spotify player.
- [`<wistia-video>`](https://github.com/luwes/wistia-video-element) A custom element for the Wistia player.
- [`<videojs-video>`](https://github.com/luwes/videojs-video-element) A custom element for Video.js.
- [`<cloudflare-video>`](https://github.com/luwes/cloudflare-video-element) A custom element for the Cloudflare player.
- [`<hls-video>`](https://github.com/muxinc/hls-video-element) A custom element for playing HTTP Live Streaming (HLS) videos.
- [`castable-video`](https://github.com/muxinc/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player custom element.
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
