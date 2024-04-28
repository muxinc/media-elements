import { test } from 'zora';
import { CustomVideoElement } from '../custom-media-element.js';

// The custom-video-element JS import is defined in web-test-runner.config.js
// for both an eager and lazy custom element upgrade.

if (!globalThis.customElements.get('custom-video')) {
  globalThis.customElements.define('custom-video', CustomVideoElement);
}

test('is an instance of CustomVideoElement and HTMLElement', async function (t) {
  const customVideo = globalThis.customVideo;
  t.ok(customVideo instanceof globalThis.customElements.get('custom-video'));
  t.ok(customVideo instanceof HTMLElement);
});

test('uses attributes for getters if nativeEl is not ready yet', async function (t) {
  class MyVideoElement extends CustomVideoElement {
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

  const customVideo = await fixture(
    `<my-video muted autoplay src="http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4"></my-video>`
  );

  t.equal(customVideo.defaultMuted, true, 'defaultMuted is true');
  t.equal(customVideo.autoplay, true, 'autoplay is true');
  t.equal(
    customVideo.src,
    'http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4'
  );
});

test('has default video reflecting props', async function (t) {
  const customVideo = globalThis.customVideo;

  customVideo.src = 'http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4';
  t.equal(
    customVideo.getAttribute('src'),
    'http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4',
    'has src attribute'
  );
  t.equal(
    customVideo.nativeEl.getAttribute('src'),
    'http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4',
    'nativeEl has src attribute'
  );

  customVideo.preload = 'none';
  t.equal(customVideo.getAttribute('preload'), 'none', 'has preload attribute');
  t.equal(customVideo.nativeEl.getAttribute('preload'), 'none', 'nativeEl has preload attribute');

  customVideo.defaultMuted = true;
  t.ok(customVideo.hasAttribute('muted'), 'has muted attribute');
  t.ok(customVideo.nativeEl.hasAttribute('muted'), 'nativeEl has muted attribute');

  customVideo.loop = true;
  t.ok(customVideo.hasAttribute('loop'), 'has loop attribute');
  t.ok(customVideo.nativeEl.hasAttribute('loop'), 'nativeEl has loop attribute');

  customVideo.autoplay = true;
  t.ok(customVideo.hasAttribute('autoplay'), 'has autoplay attribute');
  t.ok(customVideo.nativeEl.hasAttribute('autoplay'), 'nativeEl has autoplay attribute');

  customVideo.controls = true;
  t.ok(customVideo.hasAttribute('controls'), 'has controls attribute');
  t.ok(customVideo.nativeEl.hasAttribute('controls'), 'nativeEl has controls attribute');
});

test(`muted prop is set and doesn't reflect to muted attribute`, async function (t) {
  const customVideo = await fixture(
    `<custom-video></custom-video>`
  );

  customVideo.muted = true;

  t.ok(customVideo.muted, 'has muted true');
  t.ok(!customVideo.hasAttribute('muted'), 'has no muted attribute');
});

test('has a working muted attribute', async function (t) {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => addEventListener('DOMContentLoaded', resolve));
  }

  const customVideo = globalThis.customVideo;

  t.ok(customVideo.hasAttribute('muted'), 'has muted attribute');
  t.ok(customVideo.muted, 'has muted=true property');
  t.ok(
    customVideo.nativeEl.hasAttribute('muted'),
    'nativeEl has muted attribute'
  );
  t.ok(customVideo.nativeEl.muted, 'nativeEl has muted=true property');

  let playing;
  customVideo.addEventListener('playing', () => (playing = true));

  try {
    await customVideo.play();
  } catch (error) {
    console.warn(error);
  }

  t.ok(playing, 'playing event fired');
  t.ok(!customVideo.paused, 'paused prop is false');
});

test('adds and removes tracks and sources', async function (t) {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => addEventListener('DOMContentLoaded', resolve));
  }

  const customVideo = globalThis.customVideo;

  customVideo.innerHTML = `
    <track default label="English" kind="captions" srclang="en" src="../en-cc.vtt">
    <track label="thumbnails" id="customTrack" default kind="metadata" src="https://image.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/storyboard.vtt">
  `;

  await Promise.resolve();

  t.equal(customVideo.querySelectorAll('track').length, 2);
  t.equal(customVideo.textTracks.length, 2);

  customVideo.querySelector('track').remove();

  await Promise.resolve();

  t.equal(customVideo.querySelectorAll('track').length, 1);
  t.equal(customVideo.textTracks.length, 1);
});

test('has HTMLVideoElement like properties', async function (t) {
  const customVideo = await fixture(`<custom-video></custom-video>`);
  const customVideoElementProps = [
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

  customVideoElementProps.forEach((prop) => {
    t.ok(
      prop in customVideo,
      `${prop} exists in an instance of CustomVideoElement`
    );
  });
});

test('has HTMLVideoElement like events', async function (t) {
  const customVideo = await fixture(`<custom-video></custom-video>`);
  const customVideoElementEvents = [
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
    'webkitbeginfullscreen',
    'webkitendfullscreen',
    'webkitpresentationmodechanged',
  ];

  customVideoElementEvents.forEach((event) => {
    t.ok(
      customVideo.constructor.Events.includes(event),
      `${event} exists in CustomVideoElement.Events`
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
