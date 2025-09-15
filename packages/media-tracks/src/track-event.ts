import type { AudioTrack } from './audio-track.js';
import { TextTrack } from './text-track.js';
import type { VideoTrack } from './video-track.js';

export class TrackEvent extends Event {
  track: VideoTrack | AudioTrack | TextTrack;

  constructor(type: string, init: Record<string, VideoTrack | AudioTrack | TextTrack>) {
    super(type);
    this.track = init.track;
  }
}
