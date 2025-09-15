import { modeChanged as modeChanged, TextTrackList } from './text-track-list.js';

export const TextTrackKind = {
  subtitles: 'subtitles',
  captions: 'captions',
  descriptions: 'descriptions',
  chapters: 'chapters',
  metadata: 'metadata',
};

export class TextTrack {
  id?: string;
  kind?: string;
  label = '';
  language = '';
  sourceBuffer?: SourceBuffer;
  #mode: 'disabled' | 'showing' | 'hidden' = 'disabled';
  _trackList?: TextTrackList;

  // new private property to store the parent TextTrackList

  get mode(): 'disabled' | 'showing' | 'hidden' {
    return this.#mode;
  }

  set mode(val: 'disabled' | 'showing' | 'hidden') {
    console.log('Setting mode from', this.#mode, 'to', val);
    if (this.#mode === val) return;
    this.#mode = val;

    modeChanged(this);
  }
}
