import { selectedChanged } from './video-track-list.js';
import { VideoRendition } from './video-rendition.js';
import { addRendition, removeRendition } from './video-rendition-list.js';

export const VideoTrackKind = {
  alternative: 'alternative',
  captions: 'captions',
  main: 'main',
  sign: 'sign',
  subtitles: 'subtitles',
  commentary: 'commentary',
};

export class VideoTrack {
  id?: string;
  kind?: string;
  label = '';
  language = '';
  sourceBuffer?: SourceBuffer;
  #selected = false;

  addRendition(
    src: string,
    width?: number,
    height?: number,
    codec?: string,
    bitrate?: number,
    frameRate?: number,
  ) {
    const rendition = new VideoRendition();
    rendition.src = src;
    rendition.width = width;
    rendition.height = height;
    rendition.frameRate = frameRate;
    rendition.bitrate = bitrate;
    rendition.codec = codec;
    addRendition(this, rendition);
    return rendition;
  }

  removeRendition(rendition: VideoRendition) {
    removeRendition(rendition);
  }

  get selected(): boolean {
    return this.#selected;
  }

  set selected(val: boolean) {
    if (this.#selected === val) return;
    this.#selected = val;

    if (val !== true) return;

    selectedChanged(this);
  }
}
