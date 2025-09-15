import { TextTrack } from './text-track.js';
import { TrackEvent } from './track-event.js';
import { getPrivate } from './utils.js';

export function addTextTrack(trackList: TextTrackList, track: TextTrack) {
  if (typeof track !== 'object' || track === null) return;

  const privateTrackList = getPrivate(trackList);
  if (!privateTrackList.trackSet) {
    privateTrackList.trackSet = new Set<TextTrack>();
  }
  const trackSet: Set<TextTrack> = privateTrackList.trackSet;
  if (trackSet.has(track)) return;
  trackSet.add(track);

  const index = trackSet.size - 1;
  if (!(index in TextTrackList.prototype)) {
    Object.defineProperty(TextTrackList.prototype, index, {
      get() {
        return [...getPrivate(this).trackSet][index];
      }
    });
  }

  queueMicrotask(() => {
    trackList.dispatchEvent(new TrackEvent('addtrack', { track }));
  });
}

export function removeTextTrack(trackList: TextTrackList, track: TextTrack) {
  if (typeof track !== 'object' || track === null) return;

  const privateTrackList = getPrivate(trackList);
  if (!privateTrackList.trackSet) {
    privateTrackList.trackSet = new Set<TextTrack>();
  }
  const trackSet: Set<TextTrack> = privateTrackList.trackSet;
  if (!trackSet.has(track)) return;
  trackSet.delete(track);

  queueMicrotask(() => {
    trackList.dispatchEvent(new TrackEvent('removetrack', { track }));
  });
}
  
export function modeChanged(track: TextTrack) {
  const trackList: TextTrackList | undefined = track._trackList;
  if (!trackList || !track) return;

  const privateTrackList = getPrivate(trackList);
  if (!privateTrackList.trackSet) {
    privateTrackList.trackSet = new Set<TextTrack>();
  }

  if (privateTrackList.changeRequested) return;
  privateTrackList.changeRequested = true;

  queueMicrotask(() => {
    delete privateTrackList.changeRequested;
    trackList.dispatchEvent(new Event('change'));
  });
}

export class TextTrackList extends EventTarget {
  [index: number]: TextTrack;
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

  getTrackById(id: string): TextTrack | null {
    return [...this.#tracks].find(track => track.id === id) ?? null;
  }

  get selectedIndex() {
    return [...this.#tracks].findIndex(track => track.mode === 'showing');
  }

  get onaddtrack() {
    return this.#addTrackCallback;
  }

  set onaddtrack(callback: ((event?: { track: TextTrack }) => void) | undefined) {
    if (this.#addTrackCallback) {
      this.removeEventListener('addtrack', this.#addTrackCallback);
      this.#addTrackCallback = undefined;
    }
    if (typeof callback === 'function') {
      this.#addTrackCallback = callback;
      this.addEventListener('addtrack', (event) => callback?.(event as unknown as { track: TextTrack }));
    }
  }

  get onremovetrack() {
    return this.#removeTrackCallback;
  }

  set onremovetrack(callback: ((event?: { track: TextTrack }) => void) | undefined) {
    if (this.#removeTrackCallback) {
      this.removeEventListener('removetrack', this.#removeTrackCallback);
      this.#removeTrackCallback = undefined;
    }
    if (typeof callback === 'function') {
      this.#removeTrackCallback = callback;
      this.addEventListener('removetrack',  (event) => callback?.(event as unknown as { track: TextTrack }));
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
    if (typeof callback === 'function') {
      this.#changeCallback = callback;
      this.addEventListener('change', callback);
    }
  }
}

