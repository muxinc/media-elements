# Media Tracks

[![NPM Version](https://img.shields.io/npm/v/media-tracks?style=flat-square&color=informational)](https://www.npmjs.com/package/media-tracks) 
[![NPM Downloads](https://img.shields.io/npm/dm/media-tracks?style=flat-square&color=informational&label=npm)](https://www.npmjs.com/package/media-tracks) 
[![jsDelivr hits (npm)](https://img.shields.io/jsdelivr/npm/hm/media-tracks?style=flat-square&color=%23FF5627)](https://www.jsdelivr.com/package/npm/media-tracks)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/media-tracks?style=flat-square&color=success&label=gzip)](https://bundlephobia.com/result?p=media-tracks) 
[![Codecov](https://img.shields.io/codecov/c/github/muxinc/media-tracks?style=flat-square)](https://app.codecov.io/gh/muxinc/media-tracks)


Polyfills the media elements (`<audio>` or `<video>`) adding audio and video tracks (as [specced](https://html.spec.whatwg.org/multipage/media.html#media-resources-with-multiple-media-tracks)) and with renditions as proposed in [media-ui-extensions](https://github.com/video-dev/media-ui-extensions).

- Allows media engines like [hls.js](https://github.com/video-dev/hls.js)
or [shaka](https://github.com/shaka-project/shaka-player) to add media tracks w/
renditions from the information they retrieve from the manifest to a standardized
API.
- Allows media UI implementations like [media-chrome](https://github.com/muxinc/media-chrome) to consume this uniform API and render media track selection menus
and rendition (quality) selection menus.


## Caveats

- iOS does not support manual rendition switching as it is using a native
  HLS implementation. This library can't change anything about that. 

## Interfaces

```ts
declare global {
    interface HTMLMediaElement {
        videoTracks: VideoTrackList;
        audioTracks: AudioTrackList;
        addVideoTrack(kind: string, label?: string, language?: string): VideoTrack;
        addAudioTrack(kind: string, label?: string, language?: string): AudioTrack;
        removeVideoTrack(track: VideoTrack): void;
        removeAudioTrack(track: AudioTrack): void;
        videoRenditions: VideoRenditionList;
        audioRenditions: AudioRenditionList;
    }
}

declare class VideoTrackList extends EventTarget {
    [index: number]: VideoTrack;
    [Symbol.iterator](): IterableIterator<VideoTrack>;
    get length(): number;
    getTrackById(id: string): VideoTrack | null;
    get selectedIndex(): number;
    get onaddtrack(): ((event?: { track: VideoTrack }) => void) | undefined;
    set onaddtrack(callback: ((event?: { track: VideoTrack }) => void) | undefined);
    get onremovetrack(): ((event?: { track: VideoTrack }) => void) | undefined;
    set onremovetrack(callback: ((event?: { track: VideoTrack }) => void) | undefined);
    get onchange(): (() => void) | undefined;
    set onchange(callback: (() => void) | undefined);
}

declare const VideoTrackKind: {
    alternative: string;
    captions: string;
    main: string;
    sign: string;
    subtitles: string;
    commentary: string;
};

declare class VideoTrack {
    id?: string;
    kind?: string;
    label: string;
    language: string;
    sourceBuffer?: SourceBuffer;
    addRendition(src: string, width?: number, height?: number, codec?: string, bitrate?: number, frameRate?: number): VideoRendition;
    removeRendition(rendition: AudioRendition): void;
    get selected(): boolean;
    set selected(val: boolean);
}

declare class VideoRenditionList extends EventTarget {
    [index: number]: VideoRendition;
    [Symbol.iterator](): IterableIterator<VideoRendition>;
    get length(): number;
    getRenditionById(id: string): VideoRendition | null;
    get selectedIndex(): number;
    set selectedIndex(index: number);
    get onaddrendition(): ((event?: { rendition: VideoRendition }) => void) | undefined;
    set onaddrendition(callback: ((event?: { rendition: VideoRendition }) => void) | undefined);
    get onremoverendition(): ((event?: { rendition: VideoRendition }) => void) | undefined;
    set onremoverendition(callback: ((event?: { rendition: VideoRendition }) => void) | undefined);
    get onchange(): (() => void) | undefined;
    set onchange(callback: (() => void) | undefined);
}

declare class VideoRendition {
    src?: string;
    id?: string;
    width?: number;
    height?: number;
    bitrate?: number;
    frameRate?: number;
    codec?: string;
    get selected(): boolean;
    set selected(val: boolean);
}

declare class AudioTrackList extends EventTarget {
    [index: number]: AudioTrack;
    [Symbol.iterator](): IterableIterator<AudioTrack>;
    get length(): number;
    getTrackById(id: string): AudioTrack | null;
    get onaddtrack(): ((event?: { track: AudioTrack }) => void) | undefined;
    set onaddtrack(callback: ((event?: { track: AudioTrack }) => void) | undefined);
    get onremovetrack(): ((event?: { track: AudioTrack }) => void) | undefined;
    set onremovetrack(callback: ((event?: { track: AudioTrack }) => void) | undefined);
    get onchange(): (() => void) | undefined;
    set onchange(callback: (() => void) | undefined);
}

declare const AudioTrackKind: {
    alternative: string;
    descriptions: string;
    main: string;
    'main-desc': string;
    translation: string;
    commentary: string;
};

declare class AudioTrack {
    id?: string;
    kind?: string;
    label: string;
    language: string;
    sourceBuffer?: SourceBuffer;
    addRendition(src: string, codec?: string, bitrate?: number): AudioRendition;
    removeRendition(rendition: AudioRendition): void;
    get enabled(): boolean;
    set enabled(val: boolean);
}

declare class AudioRenditionList extends EventTarget {
    [index: number]: AudioRendition;
    [Symbol.iterator](): IterableIterator<AudioRendition>;
    get length(): number;
    getRenditionById(id: string): AudioRendition | null;
    get selectedIndex(): number;
    set selectedIndex(index: number);
    get onaddrendition(): ((event?: { rendition: VideoRendition }) => void) | undefined;
    set onaddrendition(callback: ((event?: { rendition: VideoRendition }) => void) | undefined);
    get onremoverendition(): ((event?: { rendition: VideoRendition }) => void) | undefined;
    set onremoverendition(callback: ((event?: { rendition: VideoRendition }) => void) | undefined);
    get onchange(): (() => void) | undefined;
    set onchange(callback: (() => void) | undefined);
}

declare class AudioRendition {
    src?: string;
    id?: string;
    bitrate?: number;
    codec?: string;
    get selected(): boolean;
    set selected(val: boolean);
}
```
