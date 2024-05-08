# `<dash-video>`

[![NPM Version](https://img.shields.io/npm/v/dash-video-element?style=flat-square&color=informational)](https://www.npmjs.com/package/dash-video-element) 
[![NPM Downloads](https://img.shields.io/npm/dm/dash-video-element?style=flat-square&color=informational&label=npm)](https://www.npmjs.com/package/dash-video-element) 
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/dash-video-element?style=flat-square&color=%23FF5627)](https://www.jsdelivr.com/package/npm/dash-video-element)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/dash-video-element?style=flat-square&color=success&label=gzip)](https://bundlephobia.com/result?p=dash-video-element) 

A [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) 
for dash.js with an API that matches the 
[`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) API.

- 🏄‍♂️ Compatible [`HTMLMediaElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) API
- 🕺 Seamlessly integrates with [Media Chrome](https://github.com/muxinc/media-chrome)

## Example

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/dash-video-element@0/+esm"></script>
<dash-video controls src="https://player.vimeo.com/external/648359100.mpd?s=a4419a2e2113cc24a87aef2f93ef69a8e4c8fb0c"></dash-video>
```

## Install

First install the NPM package:

```bash
npm install dash-video-element
```

Import in your app javascript (e.g. src/App.js):

```js
import 'dash-video-element';
```

Optionally, you can load the script directly from a CDN using [JSDelivr](https://www.jsdelivr.com/):

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/dash-video-element@0/+esm"></script>
```

This will register the custom elements with the browser so they can be used as HTML.

## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<youtube-video>`](https://github.com/muxinc/media-elements/tree/main/packages/youtube-video-element) A custom element for the YouTube player.
- [`<vimeo-video>`](https://github.com/muxinc/media-elements/tree/main/packages/vimeo-video-element) A custom element for the Vimeo player.
- [`<videojs-video>`](https://github.com/muxinc/media-elements/tree/main/packages/videojs-video-element) A custom element for Video.js.
- [`<wistia-video>`](https://github.com/muxinc/media-elements/tree/main/packages/wistia-video-element) A custom element for the Wistia player.
- [`<jwplayer-video>`](https://github.com/muxinc/media-elements/tree/main/packages/jwplayer-video-element) A custom element for the JW player.
- [`castable-video`](https://github.com/muxinc/media-elements/tree/main/packages/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player custom element.
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
