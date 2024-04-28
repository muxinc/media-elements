import { CustomVideoElement } from 'custom-media-element';
import Hls from 'hls.js';

type HlsVideoElementConstructor<T> = { new(): T };

export function HlsVideoMixin(superclass: any): HlsVideoElementConstructor<HLSVideoElement>;

export class HLSVideoElement extends CustomVideoElement {
  /**
   * The current instance of the HLS.js library.
   *
   * @example
   * ```js
   * const video = document.querySelector('hls-video');
   * video.api.on(Hls.Events.MANIFEST_PARSED, () => {});
   * ```
   */
  api: Hls | null;

  /**
   * Fires when attributes are changed on the custom element.
   */
  attributeChangedCallback(attrName: string, oldValue: any, newValue: any): void;

  /**
   * Unloads the HLS.js instance and detaches it from the video element.
   */
  #destroy(): void;
}

export default HLSVideoElement;

export { Hls };
