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

      const imageTracks = this.api.getTracksFor("image");
      const imageReps = this.api.getRepresentationsByType("image")
      
      console.log("Thumbnail Tracks", imageTracks)
      console.log("Thumbnail Representations", imageReps)
      
      imageReps.forEach(async (rep, idx) =>  {
        const generateAllCues = async (totalThumbnails, thumbnailDuration) => {
          const promises = [];

          for (let thIndex = 0; thIndex < totalThumbnails; thIndex++) {
            const startTime = thIndex * thumbnailDuration;
            const endTime = startTime + thumbnailDuration;

            const promise = new Promise((resolve, reject) => {
              this.api.provideThumbnail(startTime, (thumbnailInfo) => {
                try {
                  const cue = generateVttCue({ startTime, endTime, index: thIndex, ...thumbnailInfo });
                  console.log("Calculated cue")
                  resolve(cue);
                } catch (err) {
                  reject(err);
                }
              });
            });

            promises.push(promise);
          }

          const cues = await Promise.all(promises);
          return cues;
        }
        if (idx > 0) return; // We have to figure out what to do if we have multiple tracks

        const {totalThumbnails, thumbnailDuration} = calculateThumbnailTimes(rep)
        console.log("Total", totalThumbnails, "thumbnails every", thumbnailDuration)
        const cues = await generateAllCues(totalThumbnails, thumbnailDuration);

        const track = createThumbnailTrack(cues);

        this.nativeEl.appendChild(track);
        track.dispatchEvent(new Event('change')); // For live streams we would have to do this multiple times. Do we want to support livestreams?
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
  const tduration = duration / timescale; // duration of one thumbnail tile

  const thduration = tduration / ttiles;
  const totalThumbnails = Math.ceil(duration / thduration);
  
  return {totalThumbnails: totalThumbnails, thumbnailDuration: thduration};
}

// {url: 'https://livesim2.dashif.org/livesim2/testpic_2s/thumbs/880227387.jpg', width: 160, height: 90, x: 0, y: 0}
// {url: String, width: Number, height: Number, x: Number, y: Number, startTime: Number, endTime: Number}
function generateVttCue({url, width, height, x, y, startTime, endTime, index}) {
  const imageUrl = `${url}#xywh=${x},${y},${width},${height}` 

  const cue = new VTTCue(startTime, endTime, imageUrl);
  cue.id = `thumb_${index + 1}`; // Not sure if neccessary

  return cue;
}

function createThumbnailTrack() {
  const track = document.createElement('track');
  track.kind = 'metadata';
  track.label = 'thumbnails';
  track.srclang = 'en';
  track.mode = "hidden";
  track.default = true;
  
  const vttUrl = cuesToVttBlobUrl(cues);

  track.src = vttUrl;
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
