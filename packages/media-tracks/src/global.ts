import type { VideoTrack } from './video-track.js';
import type { VideoTrackList } from './video-track-list.js';
import type { AudioTrack } from './audio-track.js';
import type { AudioTrackList } from './audio-track-list.js';
import type { VideoRenditionList } from './video-rendition-list.js';
import type { AudioRenditionList } from './audio-rendition-list.js';

declare global {
  interface HTMLMediaElement {
    videoTracks: VideoTrackList;
    audioTracks: AudioTrackList;
    addVideoTrack(kind: string, label?: string, language?: string): VideoTrack;
    addAudioTrack(kind: string, label?: string, language?: string): AudioTrack;
    removeVideoTrack(track: VideoTrack): void;
    removeAudioTrack(track: AudioTrack): void;
    videoRenditions: VideoRenditionList;
    audioRenditions: AudioRenditionList;
  }
}
