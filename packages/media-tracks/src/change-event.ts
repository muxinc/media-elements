import type { AudioTrack } from './audio-track.js';
import type { VideoTrack } from './video-track.js';

export class TrackEvent extends Event {
  track: VideoTrack | AudioTrack;

  constructor(type: string, init: Record<string, VideoTrack | AudioTrack>) {
    super(type);
    this.track = init.track;
  }
}
