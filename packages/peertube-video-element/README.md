# `<peertube-video>`

[![NPM Version](https://img.shields.io/npm/v/peertube-video-element?style=flat-square&color=informational)](https://www.npmjs.com/package/peertube-video-element) 
[![NPM Downloads](https://img.shields.io/npm/dm/peertube-video-element?style=flat-square&color=informational&label=npm)](https://www.npmjs.com/package/peertube-video-element) 
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/peertube-video-element?style=flat-square&color=%23FF5627)](https://www.jsdelivr.com/package/npm/peertube-video-element)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/peertube-video-element?style=flat-square&color=success&label=gzip)](https://bundlephobia.com/result?p=peertube-video-element) 

A [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
for the [PeerTube](https://joinpeertube.org/) player with an API that matches the
[`<video>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video) API.

- 🏄‍♂️ Compatible [`HTMLMediaElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) API
- 🕺 Seamlessly integrates with [Media Chrome](https://github.com/muxinc/media-chrome)
- 🎞️ Rendition/quality selection via [`media-tracks`](https://github.com/muxinc/media-elements/tree/main/packages/media-tracks)
- 💬 Caption track support

## Example

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/peertube-video-element@1.0/+esm"></script>
<peertube-video controls src="https://video.mshparisnord.fr/w/7r2FxoQdYjun6tYWJfHUCa"></peertube-video>
```

Supported URL formats:

```text
https://instance.example/videos/watch/<id>
https://instance.example/videos/embed/<id>
https://instance.example/w/<id>
```

## Install

First install the NPM package:

```bash
npm install peertube-video-element
```

Import in your app javascript (e.g. src/App.js):

```js
import 'peertube-video-element';
```

Optionally, you can load the script directly from a CDN using [JSDelivr](https://www.jsdelivr.com/):

<!-- prettier-ignore -->
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/peertube-video-element@1.0/+esm"></script>
```

This will register the custom elements with the browser so they can be used as HTML.

## Usage with [Media Chrome](https://github.com/muxinc/media-chrome)

```html
<script type="importmap">
  { "imports": { "media-tracks": "https://cdn.jsdelivr.net/npm/media-tracks@0.3/+esm" } }
</script>
<script type="module" src="https://cdn.jsdelivr.net/npm/peertube-video-element@1.0/+esm"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/media-chrome@4/+esm"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/media-chrome@4/menu/+esm"></script>

<media-controller>
  <peertube-video slot="media" src="https://video.mshparisnord.fr/w/7r2FxoQdYjun6tYWJfHUCa"></peertube-video>
  <media-captions-menu hidden anchor="auto"></media-captions-menu>
  <media-rendition-menu anchor="auto" hidden>
    <div slot="header">Quality</div>
  </media-rendition-menu>
  <media-control-bar>
    <media-play-button></media-play-button>
    <media-mute-button></media-mute-button>
    <media-volume-range></media-volume-range>
    <media-time-range></media-time-range>
    <media-time-display show-duration></media-time-display>
    <media-captions-menu-button></media-captions-menu-button>
    <media-rendition-menu-button></media-rendition-menu-button>
    <media-fullscreen-button></media-fullscreen-button>
  </media-control-bar>
</media-controller>
```

## `config` prop

Pass PeerTube embed URL parameters via the `config` property to customize player behavior:

```js
const player = document.querySelector('peertube-video');
player.config = {
  p2p: 0,             // disable P2P
  mode: 'web-video',  // 'web-video' (MP4) or 'p2p-media-loader' (HLS/ABR)
  subtitle: 'en',     // auto-select caption language on load
  playbackRate: 1.5,  // initial playback speed
};
```

| Option | Type | Description |
| ------ | ---- | ----------- |
| `p2p` | `0 \| 1` | Enable/disable P2P (default: `1`) |
| `mode` | `'web-video' \| 'p2p-media-loader'` | Player engine. Use `p2p-media-loader` for HLS and adaptive bitrate |
| `subtitle` | `string` | ISO language code to auto-select on load (e.g. `'en'`, `'fr'`) |
| `playbackRate` | `number` | Initial playback speed (e.g. `0.75`, `1.5`) |
| `playlistPosition` | `number` | Starting position in a playlist (1-based) |
| `waitPasswordFromEmbedAPI` | `0 \| 1` | Delay load until password is supplied via `api.setVideoPassword()` |
| `peertubeLink` | `0 \| 1` | Show/hide the PeerTube instance link |
| `title` | `0 \| 1` | Show/hide the video title overlay |
| `warningTitle` | `0 \| 1` | Show/hide the P2P warning |
| `controlBar` | `0 \| 1` | Show/hide the native control bar during playback |
| `start` | `number` | Start time in seconds |
| `stop` | `number` | Stop time in seconds |
| `bigPlayBackgroundColor` | `string` | Play button background color |
| `foregroundColor` | `string` | Text/icon foreground color |

## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<youtube-video>`](https://github.com/muxinc/media-elements/tree/main/packages/youtube-video-element) A custom element for the YouTube player.
- [`<spotify-audio>`](https://github.com/muxinc/media-elements/tree/main/packages/spotify-audio-element) A custom element for the Spotify player.
- [`<jwplayer-video>`](https://github.com/muxinc/media-elements/tree/main/packages/jwplayer-video-element) A custom element for the JW player.
- [`<videojs-video>`](https://github.com/muxinc/media-elements/tree/main/packages/videojs-video-element) A custom element for Video.js.
- [`<wistia-video>`](https://github.com/muxinc/media-elements/tree/main/packages/wistia-video-element) A custom element for the Wistia player.
- [`<cloudflare-video>`](https://github.com/muxinc/media-elements/tree/main/packages/cloudflare-video-element) A custom element for the Cloudflare player.
- [`<hls-video>`](https://github.com/muxinc/media-elements/tree/main/packages/hls-video-element) A custom element for playing HTTP Live Streaming (HLS) videos.
- [`castable-video`](https://github.com/muxinc/media-elements/tree/main/packages/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player custom element.
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
