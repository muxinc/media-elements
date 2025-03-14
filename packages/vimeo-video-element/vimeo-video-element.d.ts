export default class CustomVideoElement extends HTMLVideoElement {
  static readonly observedAttributes: string[];
  attributeChangedCallback(
    attrName: string,
    oldValue?: string | null,
    newValue?: string | null
  ): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  config: {
    airplay?: boolean;
    audio_tracks?: boolean;
    audiotrack?: string;
    autopause?: boolean;
    background?: boolean;
    byline?: boolean;
    cc?: boolean;
    chapter_id?: string;
    chapters?: boolean;
    chromecast?: boolean;
    color?: string;
    colors?: string[];
    controls?: boolean;
    dnt?: boolean;
    end_time?: number;
    fullscreen?: boolean;
    interactive_markers?: boolean;
    interactive_params?: string;
    keyboard?: boolean;
    pip?: boolean;
    play_button_position?: 'auto' | 'bottom' | 'center';
    portrait?: boolean;
    progress_bar?: boolean;
    quality?: string;
    quality_selector?: boolean;
    responsive?: boolean;
    speed?: boolean;
    start_time?: number;
    text_track?: string;
    title?: boolean;
    transcript?: boolean;
    transparent?: boolean;
    unmute_button?: boolean;
    vimeo_logo?: boolean;
    volume?: boolean;
    watch_full_video?: boolean;
  }
}
