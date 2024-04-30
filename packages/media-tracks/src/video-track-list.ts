import type { VideoTrack } from './video-track.js';
import { TrackEvent } from './track-event.js';
import { getPrivate } from './utils.js';

export function addVideoTrack(media: HTMLMediaElement, track: VideoTrack) {
  const trackList = media.videoTracks;
  getPrivate(track).media = media;

  if (!getPrivate(track).renditionSet) {
    getPrivate(track).renditionSet = new Set();
  }

  const trackSet: Set<VideoTrack> = getPrivate(trackList).trackSet;
  trackSet.add(track);
  const index = trackSet.size - 1;

  if (!(index in VideoTrackList.prototype)) {
    Object.defineProperty(VideoTrackList.prototype, index, {
      get() { return [...getPrivate(this).trackSet][index]; }
    });
  }

  // The event is queued, this is in line with the native `addtrack` event.
  // https://html.spec.whatwg.org/multipage/media.html#dom-media-addtexttrack
  //
  // This can be useful for setting additional props on the track object
  // after having called addTrack().
  queueMicrotask(() => {
    trackList.dispatchEvent(new TrackEvent('addtrack', { track }));
  });
}

export function removeVideoTrack(track: VideoTrack) {
  const trackList: VideoTrackList = getPrivate(track).media?.videoTracks;
  if (!trackList) return;

  const trackSet: Set<VideoTrack> = getPrivate(trackList).trackSet;
  trackSet.delete(track);

  queueMicrotask(() => {
    trackList.dispatchEvent(new TrackEvent('removetrack', { track }));
  });
}

export function selectedChanged(selected: VideoTrack) {
  const trackList: VideoTrackList = getPrivate(selected).media.videoTracks ?? [];
  // If other tracks are unselected, then a change event will be fired.
  let hasUnselected = false;

  for (const track of trackList) {
    if (track === selected) continue;
    track.selected = false;
    hasUnselected = true;
  }

  if (hasUnselected) {
    // Prevent firing a track list `change` event multiple times per tick.
    if (getPrivate(trackList).changeRequested) return;
    getPrivate(trackList).changeRequested = true;

    queueMicrotask(() => {
      delete getPrivate(trackList).changeRequested;
      trackList.dispatchEvent(new Event('change'));
    });
  }
}

// https://html.spec.whatwg.org/multipage/media.html#videotracklist
export class VideoTrackList extends EventTarget {
  [index: number]: VideoTrack;
  #addTrackCallback?: () => void;
  #removeTrackCallback?: () => void;
  #changeCallback?: () => void;

  constructor() {
    super();
    getPrivate(this).trackSet = new Set();
  }

  get #tracks() {
    return getPrivate(this).trackSet;
  }

  [Symbol.iterator]() {
    return this.#tracks.values();
  }

  get length() {
    return this.#tracks.size;
  }

  getTrackById(id: string): VideoTrack | null {
    return [...this.#tracks].find((track) => track.id === id) ?? null;
  }

  get selectedIndex() {
    return [...this.#tracks].findIndex((track) => track.selected);
  }

  get onaddtrack() {
    return this.#addTrackCallback;
  }

  set onaddtrack(callback: ((event?: { track: VideoTrack }) => void) | undefined) {
    if (this.#addTrackCallback) {
      this.removeEventListener('addtrack', this.#addTrackCallback);
      this.#addTrackCallback = undefined;
    }
    if (typeof callback == 'function') {
      this.#addTrackCallback = callback;
      // @ts-ignore
      this.addEventListener('addtrack', callback);
    }
  }

  get onremovetrack() {
    return this.#removeTrackCallback;
  }

  set onremovetrack(callback: ((event?: { track: VideoTrack }) => void) | undefined) {
    if (this.#removeTrackCallback) {
      this.removeEventListener('removetrack', this.#removeTrackCallback);
      this.#removeTrackCallback = undefined;
    }
    if (typeof callback == 'function') {
      this.#removeTrackCallback = callback;
      // @ts-ignore
      this.addEventListener('removetrack', callback);
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
