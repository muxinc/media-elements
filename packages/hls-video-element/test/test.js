import { test } from 'zora';
import { Hls } from '../hls-video-element.js';

function createVideoElement() {
  return fixture(`<hls-video
    src="https://stream.mux.com/r4rOE02cc95tbe3I00302nlrHfT023Q3IedFJW029w018KxZA.m3u8"
    muted
  ></hls-video>`);
}

test('has default video props', async function (t) {
  const video = await createVideoElement();

  t.equal(video.paused, true, 'is paused on initialization');
  t.ok(!video.ended, 'is not ended');
  t.ok(video.muted, 'is muted');
});

test('volume', async function (t) {
  const video = await createVideoElement();

  video.volume = 1;
  await delay(100); // postMessage is not instant
  t.equal(video.volume, 1, 'is all turned up. volume: ' + video.volume);
  video.volume = 0.5;
  await delay(100); // postMessage is not instant
  t.equal(video.volume, 0.5, 'is half volume');
});

test('loop', async function (t) {
  const video = await createVideoElement();

  t.ok(!video.loop, 'loop is false by default');
  video.loop = true;
  t.ok(video.loop, 'loop is true');
});

test('duration', async function (t) {
  const video = await createVideoElement();

  if (video.duration == null || Number.isNaN(video.duration)) {
    await promisify(video.addEventListener.bind(video))('durationchange');
  }

  t.equal(Math.round(video.duration), 115, `is 115s long`);
});

test('load promise', async function (t) {
  const video = await createVideoElement();
  video.src = 'https://stream.mux.com/1EFcsL5JET00t00mBv01t00xt00T4QeNQtsXx2cKY6DLd7RM.m3u8';

  if (video.duration == null || Number.isNaN(video.duration)) {
    await promisify(video.addEventListener.bind(video))('durationchange');
  }

  t.equal(Math.round(video.duration), 20, `is 20s long`);
});

test('play promise', async function (t) {
  const video = await createVideoElement();

  video.muted = true;

  try {
    await video.play();
  } catch (error) {
    console.warn(error);
  }
  t.ok(!video.paused, 'is playing after video.play()');
});

test('changing src twice in the same tick creates a single hls.js instance', async function (t) {
  const video = document.createElement('hls-video');
  video.setAttribute('muted', '');
  document.body.append(video);

  const originalAttachMedia = Hls.prototype.attachMedia;
  const instances = new Set();
  Hls.prototype.attachMedia = function (media) {
    if (media === video.nativeEl) instances.add(this);
    return originalAttachMedia.call(this, media);
  };

  try {
    video.src = 'https://stream.mux.com/r4rOE02cc95tbe3I00302nlrHfT023Q3IedFJW029w018KxZA.m3u8';
    video.src = 'https://stream.mux.com/1EFcsL5JET00t00mBv01t00xt00T4QeNQtsXx2cKY6DLd7RM.m3u8';
    await delay(200);

    t.equal(instances.size, 1, 'creates one hls.js instance');
    t.equal(video.api?.url, video.src, 'loads the latest src');
    t.equal(video.nativeEl.querySelectorAll('source').length, 1, 'adds one source element');
  } finally {
    Hls.prototype.attachMedia = originalAttachMedia;
    video.remove();
  }
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function promisify(fn) {
  return (...args) =>
    new Promise((resolve) => {
      fn(...args, (...res) => {
        if (res.length > 1) resolve(res);
        else resolve(res[0]);
      });
    });
}
