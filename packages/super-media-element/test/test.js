import { test } from 'zora';
import { SuperVideoElement } from '../super-media-element.js';

if (!globalThis.customElements.get('super-video')) {
  globalThis.customElements.define('super-video', SuperVideoElement);
}

test('is an instance of SuperVideoElement and HTMLElement', async function (t) {
  const superVideo = await fixture(`<super-video></super-video>`);
  t.ok(superVideo instanceof SuperVideoElement);
  t.ok(superVideo instanceof HTMLElement);
});

test('uses attributes for getters if nativeEl is not ready yet', async function (t) {
  class MyVideoElement extends SuperVideoElement {
    async load() {
      // This shows that the video like API can be delayed for players like
      // YouTube, Vimeo, Wistia, any player that requires an async load.
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }
  }
  if (!globalThis.customElements.get('my-video')) {
    globalThis.customElements.define('my-video', MyVideoElement);
  }

  const superVideo = await fixture(
    `<my-video muted autoplay src="http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4"></my-video>`
  );

  t.equal(superVideo.defaultMuted, true, 'defaultMuted is true');
  t.equal(superVideo.autoplay, true, 'autoplay is true');
  t.equal(
    superVideo.src,
    'http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4'
  );
});

test('has default video reflecting props', async function (t) {
  const superVideo = await fixture(
    `<super-video></super-video>`
  );

  superVideo.src = 'http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4';
  t.equal(
    superVideo.getAttribute('src'),
    'http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4',
    'has src attribute'
  );
  t.equal(
    superVideo.nativeEl.getAttribute('src'),
    'http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4',
    'nativeEl has src attribute'
  );

  superVideo.preload = 'none';
  t.equal(superVideo.getAttribute('preload'), 'none', 'has preload attribute');
  t.equal(superVideo.nativeEl.getAttribute('preload'), 'none', 'nativeEl has preload attribute');

  superVideo.defaultMuted = true;
  t.ok(superVideo.hasAttribute('muted'), 'has muted attribute');
  t.ok(superVideo.nativeEl.hasAttribute('muted'), 'nativeEl has muted attribute');

  superVideo.loop = true;
  t.ok(superVideo.hasAttribute('loop'), 'has loop attribute');
  t.ok(superVideo.nativeEl.hasAttribute('loop'), 'nativeEl has loop attribute');

  superVideo.autoplay = true;
  t.ok(superVideo.hasAttribute('autoplay'), 'has autoplay attribute');
  t.ok(superVideo.nativeEl.hasAttribute('autoplay'), 'nativeEl has autoplay attribute');

  superVideo.controls = true;
  t.ok(superVideo.hasAttribute('controls'), 'has controls attribute');
  t.ok(superVideo.nativeEl.hasAttribute('controls'), 'nativeEl has controls attribute');
});

test(`muted prop is set and doesn't reflect to muted attribute`, async function (t) {
  const superVideo = await fixture(
    `<super-video></super-video>`
  );

  superVideo.muted = true;

  t.ok(superVideo.muted, 'has muted true');
  t.ok(!superVideo.hasAttribute('muted'), 'has no muted attribute');
});

test('has a working muted attribute', async function (t) {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => addEventListener('DOMContentLoaded', resolve));
  }

  const superVideo = window.superVideo;

  t.ok(superVideo.hasAttribute('muted'), 'has muted attribute');
  t.ok(superVideo.muted, 'has muted=true property');
  t.ok(
    superVideo.nativeEl.hasAttribute('muted'),
    'nativeEl has muted attribute'
  );
  t.ok(superVideo.nativeEl.muted, 'nativeEl has muted=true property');

  let playing;
  superVideo.addEventListener('playing', () => (playing = true));

  try {
    await superVideo.play();
  } catch (error) {
    console.warn(error);
  }

  t.ok(playing, 'playing event fired');
  t.ok(!superVideo.paused, 'paused prop is false');
});

test('adds and removes tracks and sources', async function (t) {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => addEventListener('DOMContentLoaded', resolve));
  }

  const superVideo = window.superVideo;

  superVideo.innerHTML = `
    <track default label="English" kind="captions" srclang="en" src="../en-cc.vtt">
    <track label="thumbnails" id="customTrack" default kind="metadata" src="https://image.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/storyboard.vtt">
  `;

  await Promise.resolve();

  t.equal(superVideo.querySelectorAll('track').length, 2);
  t.equal(superVideo.textTracks.length, 2);

  superVideo.querySelector('track').remove();

  await Promise.resolve();

  t.equal(superVideo.querySelectorAll('track').length, 1);
  t.equal(superVideo.textTracks.length, 1);
});

test('has HTMLVideoElement like properties', async function (t) {
  const superVideo = await fixture(`<super-video></super-video>`);
  const superVideoElementProps = [
    'addEventListener',
    'addTextTrack',
    'autoplay',
    'buffered',
    'cancelVideoFrameCallback',
    'canPlayType',
    'captureStream',
    'controls',
    'controlsList',
    'crossOrigin',
    'currentSrc',
    'currentTime',
    'defaultMuted',
    'defaultPlaybackRate',
    'disablePictureInPicture',
    'disableRemotePlayback',
    'dispatchEvent',
    'duration',
    'ended',
    'error',
    'getVideoPlaybackQuality',
    'HAVE_CURRENT_DATA',
    'HAVE_ENOUGH_DATA',
    'HAVE_FUTURE_DATA',
    'HAVE_METADATA',
    'HAVE_NOTHING',
    'height',
    'load',
    'loop',
    'mediaKeys',
    'muted',
    'NETWORK_EMPTY',
    'NETWORK_IDLE',
    'NETWORK_LOADING',
    'NETWORK_NO_SOURCE',
    'networkState',
    'onencrypted',
    'onenterpictureinpicture',
    'onleavepictureinpicture',
    'onwaitingforkey',
    'pause',
    'paused',
    'play',
    'playbackRate',
    'played',
    'playsInline',
    'poster',
    'preload',
    'preservesPitch',
    'readyState',
    'remote',
    'removeEventListener',
    'requestPictureInPicture',
    'requestVideoFrameCallback',
    'seekable',
    'seeking',
    'setMediaKeys',
    'setSinkId',
    'sinkId',
    'src',
    'srcObject',
    'textTracks',
    'videoHeight',
    'videoWidth',
    'volume',
    'webkitAudioDecodedByteCount',
    'webkitDecodedFrameCount',
    'webkitDroppedFrameCount',
    'webkitEnterFullScreen',
    'webkitEnterFullscreen',
    'webkitExitFullScreen',
    'webkitExitFullscreen',
    'webkitVideoDecodedByteCount',
    'width',
  ];

  superVideoElementProps.forEach((prop) => {
    t.ok(
      prop in superVideo,
      `${prop} exists in an instance of SuperVideoElement`
    );
  });
});

test('has HTMLVideoElement like events', async function (t) {
  const superVideo = await fixture(`<super-video></super-video>`);
  const superVideoElementEvents = [
    'abort',
    'canplay',
    'canplaythrough',
    'durationchange',
    'emptied',
    'encrypted',
    'ended',
    'error',
    'loadeddata',
    'loadedmetadata',
    'loadstart',
    'pause',
    'play',
    'playing',
    'progress',
    'ratechange',
    'seeked',
    'seeking',
    'stalled',
    'suspend',
    'timeupdate',
    'volumechange',
    'waiting',
    'waitingforkey',
    'resize',
    'enterpictureinpicture',
    'leavepictureinpicture',
  ];

  superVideoElementEvents.forEach((event) => {
    t.ok(
      superVideo.constructor.Events.includes(event),
      `${event} exists in SuperVideoElement.Events`
    );
  });
});

async function fixture(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const fragment = template.content.cloneNode(true);
  const result = fragment.children.length > 1
    ? [...fragment.children]
    : fragment.children[0];
  document.body.append(fragment);
  return result;
}
