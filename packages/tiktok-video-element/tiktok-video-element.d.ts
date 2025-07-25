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
    /**
     * true: Display the fullscreen button
     * false: Hide the fullscreen button
     * Default to true
     * Post type: video, image
     */
    fullscreen_button?: boolean;

    /**
     * true: Display the progress bar
     * false: Hide the progress bar
     * Default to true
     * Post type: video
     */
    progress_bar?: boolean;

    /**
     * true: Display the play button
     * false: Hide the play button
     * Default to true
     * Post type: video
     */
    play_button?: boolean;

    /**
     * true: Display the volume control button
     * false: Hide the volume control button
     * Default to true
     * Post type: video, image
     */
    volume_control?: boolean;

    /**
     * true: Display the video's current playback time and duration
     * false: Hide the time info
     * Default to true
     * Post type: video
     */
    timestamp?: boolean;

    /**
     * true: Display the music info
     * false: Do not display the music info
     * Default to false
     * Post type: video, image
     */
    music_info?: boolean;

    /**
     * true: Display the video description
     * false: Do not display the video description
     * Default to false
     * Post type: video, image
     */
    description?: boolean;

    /**
     * true: Show recommended videos as related videos
     * false: Show the current video author's videos as related video
     * Default to true
     * Post type: video
     */
    rel?: boolean;

    /**
     * true: Display the browser's native context menu
     * false: Hide the browser's native context menu
     * Default to true
     * Post type: video, image
     */
    native_context_menu?: boolean;

    /**
     * true: Display the closed caption icon
     * false: Hide the closed caption icon
     * Default to false
     * Post type: video
     */
    closed_caption?: boolean;
  }
}
