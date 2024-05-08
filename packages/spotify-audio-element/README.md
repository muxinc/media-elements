# `<spotify-audio>`

[![NPM Version](https://img.shields.io/npm/v/spotify-audio-element?style=flat-square&color=informational)](https://www.npmjs.com/package/spotify-audio-element) 
[![NPM Downloads](https://img.shields.io/npm/dm/spotify-audio-element?style=flat-square&color=informational&label=npm)](https://www.npmjs.com/package/spotify-audio-element) 
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/spotify-audio-element?style=flat-square&color=%23FF5627)](https://www.jsdelivr.com/package/npm/spotify-audio-element)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/spotify-audio-element?style=flat-square&color=success&label=gzip)](https://bundlephobia.com/result?p=spotify-audio-element) 

A [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) 
for the Spotify player with an API that aims to match the 
[`<audio>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio) API.

- 🏄‍♂️ Compatible [`HTMLMediaElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) API
- 🕺 Seamlessly integrates with [Media Chrome](https://github.com/muxinc/media-chrome)

## Example

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/spotify-audio-element@0.1/+esm"></script>
<spotify-audio controls src="https://open.spotify.com/artist/246dkjvS1zLTtiykXe5h60"></spotify-audio>
```

## Install

First install the NPM package:

```bash
npm install spotify-audio-element
```

Import in your app javascript (e.g. src/App.js):

```js
import 'spotify-audio-element';
```

Optionally, you can load the script directly from a CDN using [jsDelivr](https://www.jsdelivr.com/):

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/spotify-audio-element@0.1/+esm"></script>
```

This will register the custom elements with the browser so they can be used as HTML.

## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<youtube-video>`](https://github.com/muxinc/media-elements/tree/main/packages/youtube-video-element) A custom element for the YouTube player.
- [`<vimeo-video>`](https://github.com/muxinc/media-elements/tree/main/packages/vimeo-video-element) A custom element for the Vimeo player.
- [`<jwplayer-video>`](https://github.com/muxinc/media-elements/tree/main/packages/jwplayer-video-element) A custom element for the JW player.
- [`<videojs-video>`](https://github.com/muxinc/media-elements/tree/main/packages/videojs-video-element) A custom element for Video.js.
- [`<wistia-video>`](https://github.com/muxinc/media-elements/tree/main/packages/wistia-video-element) A custom element for the Wistia player.
- [`<cloudflare-video>`](https://github.com/muxinc/media-elements/tree/main/packages/cloudflare-video-element) A custom element for the Cloudflare player.
- [`<hls-video>`](https://github.com/muxinc/media-elements/tree/main/packages/hls-video-element) A custom element for playing HTTP Live Streaming (HLS) videos.
- [`castable-video`](https://github.com/muxinc/media-elements/tree/main/packages/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player custom element.
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
