export function canPlay(src: string): boolean;

export interface PeerTubeConfig {
  /** Enable/disable P2P (default: 1) */
  p2p?: 0 | 1;
  /** Player engine: 'web-video' (MP4) or 'p2p-media-loader' (HLS/ABR) */
  mode?: 'web-video' | 'p2p-media-loader';
  /** Auto-select caption track by ISO language code (e.g. 'en', 'fr') */
  subtitle?: string;
  /** Default playback speed (e.g. 0.75, 1.5) */
  playbackRate?: number;
  /** Start playlist at this position (1-based) */
  playlistPosition?: number;
  /** Wait for password via embed API before loading */
  waitPasswordFromEmbedAPI?: 0 | 1;
  /** Show/hide the PeerTube instance link (default: 0) */
  peertubeLink?: 0 | 1;
  /** Show/hide the video title overlay (default: 0) */
  title?: 0 | 1;
  /** Show/hide the P2P warning title (default: 0) */
  warningTitle?: 0 | 1;
  /** Show/hide the control bar during playback */
  controlBar?: 0 | 1;
  /** Start time in seconds */
  start?: number;
  /** Stop time in seconds */
  stop?: number;
  /** Customize play button background color */
  bigPlayBackgroundColor?: string;
  /** Customize text/icon foreground color */
  foregroundColor?: string;
}
export default class PeerTubeVideoElement extends HTMLVideoElement {
  static readonly observedAttributes: string[];
  config: PeerTubeConfig | null;
  attributeChangedCallback(
    attrName: string,
    oldValue?: string | null,
    newValue?: string | null
  ): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
}
