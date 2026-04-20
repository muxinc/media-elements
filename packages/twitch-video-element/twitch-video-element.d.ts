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
    // Time in the video where playback starts. Specifies hours, minutes, and seconds. Default: 0h0m0s (the start of the video).
    time?: number;
  }
  // Parent domain(s) where the embed is hosted. Required by Twitch when embedding on domains other than the one that instantiates the embed.
  parent: string | string[] | null;
}
