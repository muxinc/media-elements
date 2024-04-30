import type { AudioTrack } from './audio-track.js';
import type { AudioRendition } from './audio-rendition.js';
import { RenditionEvent } from './rendition-event.js';
import { getPrivate } from './utils.js';

export function addRendition(track: AudioTrack, rendition: AudioRendition) {
  const renditionList = getPrivate(track).media.audioRenditions;

  getPrivate(rendition).media = getPrivate(track).media;
  getPrivate(rendition).track = track;

  const renditionSet: Set<AudioRendition> = getPrivate(track).renditionSet;
  renditionSet.add(rendition);
  const index = renditionSet.size - 1;

  if (!(index in AudioRenditionList.prototype)) {
    Object.defineProperty(AudioRenditionList.prototype, index, {
      get() { return getCurrentRenditions(this)[index]; },
    });
  }

  queueMicrotask(() => {
    if (!track.enabled) return;

    renditionList.dispatchEvent(new RenditionEvent('addrendition', { rendition }));
  });
}

export function removeRendition(rendition: AudioRendition) {
  const renditionList: AudioRenditionList = getPrivate(rendition).media.audioRenditions;
  const track: AudioTrack = getPrivate(rendition).track;
  const renditionSet: Set<AudioRendition> = getPrivate(track).renditionSet;
  renditionSet.delete(rendition);

  queueMicrotask(() => {
    const track: AudioTrack = getPrivate(rendition).track;
    if (!track.enabled) return;

    renditionList.dispatchEvent(new RenditionEvent('removerendition', { rendition }));
  });
}

export function selectedChanged(rendition: AudioRendition) {
  const renditionList: AudioRenditionList = getPrivate(rendition).media.audioRenditions;

  // Prevent firing a rendition list `change` event multiple times per tick.
  if (!renditionList || getPrivate(renditionList).changeRequested) return;
  getPrivate(renditionList).changeRequested = true;

  queueMicrotask(() => {
    delete getPrivate(renditionList).changeRequested

    const track: AudioTrack = getPrivate(rendition).track;
    if (!track.enabled) return;

    renditionList.dispatchEvent(new Event('change'));
  });
}

function getCurrentRenditions(renditionList: AudioRenditionList): AudioRendition[] {
  const media: HTMLMediaElement = getPrivate(renditionList).media;
  return [...media.audioTracks]
    .filter((track: AudioTrack) => track.enabled)
    .flatMap((track: AudioTrack) => [...getPrivate(track).renditionSet]);
}

export class AudioRenditionList extends EventTarget {
  [index: number]: AudioRendition;
  #addRenditionCallback?: () => void;
  #removeRenditionCallback?: () => void;
  #changeCallback?: () => void;

  [Symbol.iterator]() {
    return getCurrentRenditions(this).values();
  }

  get length() {
    return getCurrentRenditions(this).length;
  }

  getRenditionById(id: string): AudioRendition | null {
    return getCurrentRenditions(this).find((rendition) => `${rendition.id}` === `${id}`) ?? null;
  }

  get selectedIndex() {
    return getCurrentRenditions(this).findIndex((rendition) => rendition.selected);
  }

  set selectedIndex(index) {
    for (const [i, rendition] of getCurrentRenditions(this).entries()) {
      rendition.selected = i === index;
    }
  }

  get onaddrendition() {
    return this.#addRenditionCallback;
  }

  set onaddrendition(callback: ((event?: { rendition: AudioRendition }) => void) | undefined) {
    if (this.#addRenditionCallback) {
      this.removeEventListener('addrendition', this.#addRenditionCallback);
      this.#addRenditionCallback = undefined;
    }
    if (typeof callback == 'function') {
      this.#addRenditionCallback = callback;
      // @ts-ignore
      this.addEventListener('addrendition', callback);
    }
  }

  get onremoverendition() {
    return this.#removeRenditionCallback;
  }

  set onremoverendition(callback: ((event?: { rendition: AudioRendition }) => void) | undefined) {
    if (this.#removeRenditionCallback) {
      this.removeEventListener('removerendition', this.#removeRenditionCallback);
      this.#removeRenditionCallback = undefined;
    }
    if (typeof callback == 'function') {
      this.#removeRenditionCallback = callback;
      // @ts-ignore
      this.addEventListener('removerendition', callback);
    }
  }

  get onchange() {
    return this.#changeCallback;
  }

  set onchange(callback) {
    if (this.#changeCallback) {
      this.removeEventListener('change', this.#changeCallback);
      this.#changeCallback = undefined;
    }
    if (typeof callback == 'function') {
      this.#changeCallback = callback;
      this.addEventListener('change', callback);
    }
  }
}
