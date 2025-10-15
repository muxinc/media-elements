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

  async _initThumbnails(representation) {
    const generateAllCues = async (totalThumbnails, thumbnailDuration) => {
      const promises = [];

      const startNumber = representation.startNumber || 1;
      const pto = representation.presentationTimeOffset
        ? representation.presentationTimeOffset / timescale
        : 0;
      const tduration = representation.segmentDuration;
      for (let thIndex = 0; thIndex < totalThumbnails; thIndex++) {
        const startTime = calculateThumbnailStartTime({
          thIndex: thIndex, 
          thduration: thumbnailDuration, 
          ttiles: totalThumbnails, 
          tduration: tduration, 
          startNumber: startNumber, 
          pto: pto
        })
        const endTime = startTime + thumbnailDuration;

        const promise = new Promise((resolve, reject) => {
          this.api.provideThumbnail(startTime, ({ url, width, height, x, y }) => {
            try {
              const cue = new VTTCue(startTime, endTime,
                `${url}#xywh=${x},${y},${width},${height}`
              );
              resolve(cue);
            } catch (err) {
              reject(err);
            }
          });
        });

        promises.push(promise);
      }

      return await Promise.all(promises).catch((e) => console.error("Error processing thumbnails", e));
    }
    const { totalThumbnails, thumbnailDuration } = calculateThumbnailTimes(representation)
    const cues = await generateAllCues(totalThumbnails, thumbnailDuration);

    let track = this.nativeEl.querySelector('track[label="thumbnails"]')
    if (!track) {
      track = createThumbnailTrack();
      this.nativeEl.appendChild(track);
    }
    const vttUrl = cuesToVttBlobUrl(cues);
    track.src = vttUrl;

    track.dispatchEvent(new Event('change'));
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

    this.api.on(Dash.MediaPlayer.events.MANIFEST_LOADED, () => {
      const imageReps = this.api.getRepresentationsByType("image")
      imageReps.forEach(async (rep, idx) => {
        if (idx > 0) return; // For now we only support one thumbnail track

        this._initThumbnails(rep);
      })
    })
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

      const imageReps = this.api.getRepresentationsByType("image")
      imageReps.forEach(async (rep, idx) => {
        if (idx > 0) return; // For now we only support one thumbnail track

        this._initThumbnails(rep);
      })
    });
  }
}

/*
To get these values we are following the specification in 

Guidelines for Implementation: DASH-IF Interoperability Points v4.3
(https://dashif.org/docs/DASH-IF-IOP-v4.3.pdf)

Section 6.2.6. "Tiles of thumbnail images"
*/
function calculateThumbnailTimes(representation) {
  const essentialProp = representation.essentialProperties[0]

  const [htiles, vtiles] = essentialProp.value.split("x").map(Number);
  const ttiles = htiles * vtiles;

  const duration = representation.segmentDuration
  const timescale = representation.timescale || 1;
  /** Duration of a thumbnail tile */
  const tduration = duration / timescale;
  /** Duration of an individual thumbnail within a tile */
  const thduration = tduration / ttiles;
  /** How many thumbnails in a tile */
  const totalThumbnails = Math.ceil(duration / thduration);

  return { totalThumbnails: totalThumbnails, thumbnailDuration: thduration };
}

/*
To get these values we are following the specification in 

Guidelines for Implementation: DASH-IF Interoperability Points v4.3
(https://dashif.org/docs/DASH-IF-IOP-v4.3.pdf)

Section 6.2.6. "Tiles of thumbnail images"
*/
function calculateThumbnailStartTime({ thIndex, tduration, thduration, ttiles, startNumber, pto }) {
  const tnumber = Math.floor(thIndex / ttiles) + startNumber;
  const thnumber = (thIndex % ttiles) + 1;

  const tileStartTime = (tnumber - 1) * tduration - pto;
  const thumbnailStartTime = (thnumber - 1) * thduration;
  return tileStartTime + thumbnailStartTime;
}

function createThumbnailTrack() {
  const track = document.createElement('track');
  track.kind = 'metadata';
  track.label = 'thumbnails';
  track.srclang = 'en';
  track.mode = "hidden";
  track.default = true;

  return track;
}

function cuesToVttBlobUrl(cues) {
  let vtt = "WEBVTT\n\n";
  for (const cue of cues) {
    vtt += `${formatTime(cue.startTime)} --> ${formatTime(cue.endTime)}\n`;
    vtt += `${cue.text}\n\n`;
  }

  const blob = new Blob([vtt], { type: "text/vtt" });
  return URL.createObjectURL(blob);

  function formatTime(t) {
    const h = String(Math.floor(t / 3600)).padStart(2, "0");
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const s = (t % 60).toFixed(3).padStart(6, "0");
    return `${h}:${m}:${s}`;
  }
}

if (globalThis.customElements && !globalThis.customElements.get('dash-video')) {
  globalThis.customElements.define('dash-video', DashVideoElement);
}

export default DashVideoElement;
