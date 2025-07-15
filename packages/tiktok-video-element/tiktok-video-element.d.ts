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
     * 1: Display the fullscreen button
     * 0: Hide the fullscreen button
     * Default to 1
     * Post type: video, image
     */
    fullscreen_button?: boolean;

    /**
     * 1: Display the progress bar
     * 0: Hide the progress bar
     * Default to 1
     * Post type: video
     */
    progress_bar?: boolean;

    /**
     * 1: Display the play button
     * 0: Hide the play button
     * Default to 1
     * Post type: video
     */
    play_button?: boolean;

    /**
     * 1: Display the volume control button
     * 0: Hide the volume control button
     * Default to 1
     * Post type: video, image
     */
    volume_control?: boolean;

    /**
     * 1: Display the video's current playback time and duration
     * 0: Hide the time info
     * Default to 1
     * Post type: video
     */
    timestamp?: boolean;

    /**
     * 1: Play the current video repeatedly
     * 0: Stop the video while it ends
     * Default to 0
     * Post type: video
     */
    loop?: boolean;

    /**
     * 1: Automatically play the video when the player loads
     * 0: Do not start playing automatically
     * Default to 0
     * Post type: video
     */
    autoplay?: boolean;

    /**
     * 1: Display the music info
     * 0: Do not display the music info
     * Default to 0
     * Post type: video, image
     */
    music_info?: boolean;

    /**
     * 1: Display the video description
     * 0: Do not display the video description
     * Default to 0
     * Post type: video, image
     */
    description?: boolean;

    /**
     * 1: Show recommended videos as related videos
     * 0: Show the current video author's videos as related video
     * Default to 1
     * Post type: video
     */
    rel?: boolean;

    /**
     * 1: Display the browser's native context menu
     * 0: Hide the browser's native context menu
     * Default to 1
     * Post type: video, image
     */
    native_context_menu?: boolean;

    /**
     * 1: Display the closed caption icon
     * 0: Hide the closed caption icon
     * Default to 1
     * Post type: video
     */
    closed_caption?: boolean;
  }
}
