import { test } from 'zora';
import { CustomVideoElement } from '../dist/custom-media-element.js';

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

test('does not parse attribute values as markup in the shadow DOM', async function (t) {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => addEventListener('DOMContentLoaded', resolve));
  }

  const customVideo = globalThis.escapedAttrsVideo;
  const { shadowRoot, nativeEl } = customVideo;

  await Promise.all(
    [...shadowRoot.querySelectorAll('img')]
      .filter((img) => !img.complete)
      .map((img) => new Promise((resolve) => img.addEventListener('error', resolve)))
  );

  t.equal(shadowRoot.querySelectorAll('img').length, 0, 'no element is created from attribute values');
  t.equal(globalThis.injectedHandlerRan, undefined, 'no event handler from attribute values runs');
  t.equal(nativeEl.getAttribute('poster'), customVideo.getAttribute('poster'), 'nativeEl has the same poster');
  t.equal(
    nativeEl.getAttribute('crossorigin'),
    customVideo.getAttribute('crossorigin'),
    'nativeEl has the same crossorigin'
  );
});

test('passes attribute values to the native element unchanged', async function (t) {
  const attrs = {
    poster: `https://image.mux.com/a/thumbnail.webp?time=1&width=640&label="it's <b>"`,
    src: 'https://stream.mux.com/a/low.mp4?token=a.b.c&expires=1&amp=1',
    crossorigin: 'anonymous',
    preload: 'none',
  };
  const escapeAttr = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const serialized = Object.entries(attrs)
    .map(([name, value]) => `${name}="${escapeAttr(value)}"`)
    .join(' ');

  const customVideo = await fixture(`<custom-video ${serialized} controls playsinline></custom-video>`);

  for (const [name, value] of Object.entries(attrs)) {
    t.equal(customVideo.nativeEl.getAttribute(name), value, `nativeEl has the same ${name}`);
  }
  t.equal(customVideo.nativeEl.getAttribute('controls'), '', 'nativeEl has the controls attribute');
  t.equal(customVideo.nativeEl.getAttribute('playsinline'), '', 'nativeEl has the playsinline attribute');

  customVideo.remove();
});

test('getTemplateHTML returns markup that keeps attribute values', async function (t) {
  const attrs = {
    poster: `x"><img src="x" onerror="globalThis.injectedHandlerRan = true">`,
    src: `https://stream.mux.com/a/low.mp4?a=1&b='2'&c=<3>`,
    crossorigin: `'"></video><img src="x">`,
    controls: '',
  };

  const template = document.createElement('template');
  template.innerHTML = globalThis.customElements.get('custom-video').getTemplateHTML(attrs);
  const { content } = template;

  t.equal(content.querySelectorAll('img').length, 0, 'no element is created from attribute values');
  t.equal(content.querySelectorAll('video').length, 1, 'has one video element');

  const video = content.querySelector('video');
  for (const [name, value] of Object.entries(attrs)) {
    t.equal(video.getAttribute(name), value, `video has the same ${name}`);
  }
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

await test('adds and removes track and source clones', async function (t) {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => addEventListener('DOMContentLoaded', resolve));
  }

  const customVideo = globalThis.customVideo;

  customVideo.innerHTML = `
    <track default label="English" kind="captions" srclang="en" src="../en-cc.vtt">
    <track label="thumbnails" id="custom-track" default kind="metadata" src="https://image.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/storyboard.vtt">
    <source src="http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4" type="video/mp4">
    <source src="http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/high.mp4" type="video/mp4">
  `;

  await Promise.resolve();

  t.equal(customVideo.querySelectorAll('track').length, 2);
  t.equal(customVideo.textTracks.length, 2);
  t.equal(customVideo.querySelectorAll('source').length, 2);
  t.equal(customVideo.nativeEl.querySelectorAll('source').length, 2);

  customVideo.querySelector('#custom-track').remove();

  await Promise.resolve();

  t.equal(customVideo.querySelectorAll('track').length, 1);
  t.equal(customVideo.textTracks.length, 1);
  t.equal(customVideo.querySelector('track').label, 'English');

  customVideo.querySelector('source').remove();

  await Promise.resolve();

  t.equal(customVideo.querySelectorAll('source').length, 1);
  t.equal(customVideo.nativeEl.querySelectorAll('source').length, 1);

  customVideo.innerHTML = '';

  await Promise.resolve();

  t.equal(customVideo.querySelectorAll('track').length, 0);
  t.equal(customVideo.nativeEl.querySelectorAll('track').length, 0);
  t.equal(customVideo.textTracks.length, 0);
  t.equal(customVideo.querySelectorAll('source').length, 0);
  t.equal(customVideo.nativeEl.querySelectorAll('source').length, 0);
});

await test('updates track and source clones attributes', async function (t) {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => addEventListener('DOMContentLoaded', resolve));
  }

  const customVideo = globalThis.customVideo;

  customVideo.innerHTML = `
    <track default label="English" kind="captions" srclang="en" src="../en-cc.vtt">
    <track label="thumbnails" id="custom-track" default kind="metadata" src="https://image.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/storyboard.vtt">
    <source src="http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/low.mp4" type="video/mp4">
    <source src="http://stream.mux.com/DS00Spx1CV902MCtPj5WknGlR102V5HFkDe/high.mp4" type="video/mp4">
  `;

  customVideo.querySelector('track').setAttribute('kind', 'subtitles');

  await Promise.resolve();

  t.equal(customVideo.querySelector('track').kind, 'subtitles');
  t.equal(customVideo.nativeEl.querySelector('track').kind, 'subtitles');

  customVideo.querySelector('source').setAttribute('type', 'video/webm');

  await Promise.resolve();

  t.equal(customVideo.querySelector('source').type, 'video/webm');
  t.equal(customVideo.nativeEl.querySelector('source').type, 'video/webm');
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
    // Commenting browser-prefixed properties out as we should not
    // *assume* they will exist, even for the browser in question (CJP)
    // 'webkitAudioDecodedByteCount',
    // 'webkitDecodedFrameCount',
    // 'webkitDroppedFrameCount',
    // 'webkitEnterFullScreen',
    // 'webkitEnterFullscreen',
    // 'webkitExitFullScreen',
    // 'webkitExitFullscreen',
    // 'webkitVideoDecodedByteCount',
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
