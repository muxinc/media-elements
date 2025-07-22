import { CustomVideoElement } from 'custom-media-element';
import { MediaTracksMixin } from 'media-tracks';

class DashVideoElement extends MediaTracksMixin(CustomVideoElement) {
  static shadowRootOptions = { ...CustomVideoElement.shadowRootOptions };

  static getTemplateHTML = (attrs) => {
    const { src, ...rest } = attrs; // eslint-disable-line no-unused-vars
    return CustomVideoElement.getTemplateHTML(rest);
  };

  #apiInit;

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName !== 'src') {
      super.attributeChangedCallback(attrName, oldValue, newValue);
    }

    if (attrName === 'src' && oldValue != newValue) {
      this.load();
    }
  }

  async load() {
    if (this.#apiInit) {
      this.api.attachSource(this.src);
      return;
    }

    this.#apiInit = true;

    const Dash = await import('dashjs');
    this.api = Dash.MediaPlayer().create();
    this.api.initialize(this.nativeEl, this.src, this.autoplay);

    this.api.on(Dash.MediaPlayer.events.STREAM_INITIALIZED, () => {
      const bitrateList = this.api.getRepresentationsByType('video');

      let videoTrack = this.videoTracks.getTrackById('main');
      if (!videoTrack) {
        videoTrack = this.addVideoTrack('main');
        videoTrack.id = 'main';
        videoTrack.selected = true;
      }

      bitrateList.forEach((rep) => {
        const bitrate =
          rep.bandwidth ?? rep.bitrate ?? (Number.isFinite(rep.bitrateInKbit) ? rep.bitrateInKbit * 1000 : undefined);

        const rendition = videoTrack.addRendition(rep.id, rep.width, rep.height, rep.mimeType ?? rep.codec, bitrate);
        rendition.id = rep.id;
      });

      this.videoRenditions.addEventListener('change', () => {
        const selected = this.videoRenditions[this.videoRenditions.selectedIndex];

        if (selected?.id) {
          this.api.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } });
          this.api.setRepresentationForTypeById('video', selected.id, true);
        } else {
          this.api.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } });
        }
      });
    });
  }
}

if (globalThis.customElements && !globalThis.customElements.get('dash-video')) {
  globalThis.customElements.define('dash-video', DashVideoElement);
}

export default DashVideoElement;
