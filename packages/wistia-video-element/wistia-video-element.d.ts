export type WistiaPluginConfig = Record<string, unknown>;

export type WistiaEmbedOptions = {
  autoPlay?: boolean;
  chromeless?: boolean;
  controlsVisibleOnLoad?: boolean;
  copyLinkAndThumbnailEnabled?: boolean;
  doNotTrack?: boolean;
  email?: string;
  endVideoBehavior?: 'default' | 'reset' | 'loop';
  fakeFullscreen?: boolean;
  fitStrategy?: 'contain' | 'cover' | 'fill' | 'none';
  fullscreenButton?: boolean;
  muted?: boolean;
  keyMoments?: boolean;
  playbackRateControl?: boolean;
  playbar?: boolean;
  playButton?: boolean;
  playerColor?: string;
  playlistLinks?: boolean;
  playlistLoop?: boolean;
  playsinline?: boolean;
  playPauseNotifier?: boolean;
  playSuspendedOffScreen?: boolean;
  preload?: 'metadata' | 'auto' | 'none' | boolean;
  qualityControl?: boolean;
  qualityMax?: 224 | 360 | 540 | 720 | 1080 | 3840;
  qualityMin?: 224 | 360 | 540 | 720 | 1080 | 3840;
  resumable?: boolean | 'auto';
  seo?: boolean;
  settingsControl?: boolean;
  silentAutoPlay?: boolean | 'allow';
  smallPlayButton?: boolean;
  stillUrl?: string;
  time?: number | string;
  thumbnailAltText?: string;
  videoFoam?:
    | boolean
    | {
        minWidth?: number;
        maxWidth?: number;
        minHeight?: number;
        maxHeight?: number;
      };
  volume?: number;
  volumeControl?: boolean;
  wmode?: string;
  plugin?: WistiaPluginConfig;
};

export default class CustomVideoElement extends HTMLVideoElement {
  static readonly observedAttributes: string[];
  attributeChangedCallback(attrName: string, oldValue?: string | null, newValue?: string | null): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  config: WistiaEmbedOptions | null;
}
