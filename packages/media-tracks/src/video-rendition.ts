import { selectedChanged } from './video-rendition-list.js';

/**
 * - The consumer should use the `selected` setter to select 1 or multiple
 *   renditions that the engine is allowed to play.
 */
export class VideoRendition {
  src?: string;
  id?: string;
  width?: number;
  height?: number;
  bitrate?: number;
  frameRate?: number;
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
