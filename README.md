# media-elements

A collection of HTMLMediaElement compatible elements and add-ons.

| Name                                                                                 | Description                                                                    |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| [custom-media-element](packages/custom-media-element)                                | A custom element for extending the native elements `<audio>` or `<video>`.     |
| [media-tracks](packages/media-tracks)                                                | Polyfill audio and video tracks with renditions.                               |
| [castable-video](packages/castable-video)                                            | Cast your video element to the big screen with ease!                           |
| [`<mux-player>`↗](https://github.com/muxinc/elements/tree/main/packages/mux-player) | The [Mux](https://www.mux.com/) video player custom element.                   |
| [`<mux-video>`↗](https://github.com/muxinc/elements/tree/main/packages/mux-video)   | The [Mux](https://www.mux.com/) video element w/ hls.js and Mux data built-in. |
| [`<hls-video>`](packages/hls-video-element)                                          | A custom video element for hls.js.                                             |
| [`<dash-video>`](packages/dash-video-element)                                        | A custom video element for dash.js.                                            |
| [`<shaka-video>`](packages/shaka-video-element)                                      | A custom video element for Shaka Player.                                       |
| [`<youtube-video>`](packages/youtube-video-element)                                  | A custom video element for YouTube player.                                     |
| [`<tiktok-video>`](packages/tiktok-video-element)                                    | A custom video element for TikTok player.                                      |
| [`<vimeo-video>`](packages/vimeo-video-element)                                      | A custom video element for Vimeo player.                                       |
| [`<videojs-video>`](packages/videojs-video-element)                                  | A custom video element for Video.js.                                           |
| [`<spotify-audio>`](packages/spotify-audio-element)                                  | A custom audio element for Spotify player.                                     |
| [`<wistia-video>`](packages/wistia-video-element)                                    | A custom video element for Wistia player.                                      |
| [`<jwplayer-video>`](packages/jwplayer-video-element)                                | A custom video element for JW Player.                                          |
| [`<twitch-video>`](packages/twitch-video-element)                                    | A custom video element for Twitch player.                                      |
| [`<cloudflare-video>`](packages/cloudflare-video-element)                            | A custom video element for Cloudflare Stream.                                  |
| [`<peertube-video>`](packages/peertube-video-element)                                | A custom video element for PeerTube player.                                    |

## Browser support

The packages in this repo are distributed as **ESNext** — including modern JavaScript features like [private class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties). This is intentional: these packages are designed to be imported and processed by your own bundler or build tool, which is responsible for transpiling to your target browsers.

If you need to support browsers that don't have these features natively (e.g. Safari < 14.1), configure your bundler to include these packages in its transpilation step and set your desired target (e.g. `es2019`).

> **Note:** Unlike [`media-chrome`](https://github.com/muxinc/media-chrome), which ships pre-transpiled to `es2019`, the packages in this repository are distributed as ESNext. You are responsible for configuring your build pipeline to handle any necessary transpilation for your target environments.
