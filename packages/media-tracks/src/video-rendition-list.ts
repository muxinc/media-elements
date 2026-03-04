import type { VideoTrack } from './video-track.js';
import type { VideoRendition } from './video-rendition.js';
import { RenditionEvent } from './rendition-event.js';
import { getPrivate } from './utils.js';

export function addRendition(track: VideoTrack, rendition: VideoRendition) {
  const renditionList = getPrivate(track).media.videoRenditions;

  getPrivate(rendition).media = getPrivate(track).media;
  getPrivate(rendition).track = track;

  const renditionSet: Set<VideoRendition> = getPrivate(track).renditionSet;
  renditionSet.add(rendition);
  const index = renditionSet.size - 1;

  if (!(index in VideoRenditionList.prototype)) {
    Object.defineProperty(VideoRenditionList.prototype, index, {
      get() { return getCurrentRenditions(this)[index]; },
    });
  }

  queueMicrotask(() => {
    if (!track.selected) return;

    renditionList.dispatchEvent(new RenditionEvent('addrendition', { rendition }));
  });
}

export function removeRendition(rendition: VideoRendition) {
  const renditionList: VideoRenditionList = getPrivate(rendition).media.videoRenditions;
  const track: VideoTrack = getPrivate(rendition).track;
  const renditionSet: Set<VideoRendition> = getPrivate(track).renditionSet;
  renditionSet.delete(rendition);

  queueMicrotask(() => {
    const track: VideoTrack = getPrivate(rendition).track;
    if (!track.selected) return;

    renditionList.dispatchEvent(new RenditionEvent('removerendition', { rendition }));
  });
}

export function selectedChanged(rendition: VideoRendition) {
  const renditionList: VideoRenditionList = getPrivate(rendition).media.videoRenditions;

  // Prevent firing a rendition list `change` event multiple times per tick.
  if (!renditionList || getPrivate(renditionList).changeRequested) return;
  getPrivate(renditionList).changeRequested = true;

  queueMicrotask(() => {
    delete getPrivate(renditionList).changeRequested;

    const track: VideoTrack = getPrivate(rendition).track;
    if (!track.selected) return;

    renditionList.dispatchEvent(new Event('change'));
  });
}

function getCurrentRenditions(renditionList: VideoRenditionList): VideoRendition[] {
  const media: HTMLMediaElement = getPrivate(renditionList).media;
  return [...media.videoTracks]
    .filter((track: VideoTrack) => track.selected)
    .flatMap((track: VideoTrack) => [...getPrivate(track).renditionSet]);
}

export class VideoRenditionList extends EventTarget {
  [index: number]: VideoRendition;
  #addRenditionCallback?: () => void;
  #removeRenditionCallback?: () => void;
  #changeCallback?: () => void;

  [Symbol.iterator]() {
    return getCurrentRenditions(this).values();
  }

  get length() {
    return getCurrentRenditions(this).length;
  }

  getRenditionById(id: string): VideoRendition | null {
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

  set onaddrendition(callback: ((event?: { rendition: VideoRendition }) => void) | undefined) {
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

  set onremoverendition(callback: ((event?: { rendition: VideoRendition }) => void) | undefined) {
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
