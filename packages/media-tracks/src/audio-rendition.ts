import { selectedChanged } from './audio-rendition-list.js';

/**
 * - The consumer should use the `selected` setter to select 1 or multiple
 *   renditions that the engine is allowed to play.
 */
export class AudioRendition {
  src?: string;
  id?: string;
  bitrate?: number;
  codec?: string;
  #selected = false;

  get selected(): boolean {
    return this.#selected;
  }

  set selected(val: boolean) {
    if (this.#selected === val) return;
    this.#selected = val;

    selectedChanged(this);
  }
}
