import { test } from 'zora';

function createVideoElement() {
  return fixture(`<wistia-video
    src="https://wesleyluyten.wistia.com/medias/oifkgmxnkb"
    muted
  ></wistia-video>`);
}

test('has default video props', async function (t) {
  const video = await createVideoElement();

  t.equal(video.paused, true, 'is paused on initialization');

  await video.loadComplete;

  t.equal(video.paused, true, 'is paused on initialization');
  t.ok(!video.ended, 'is not ended');
  t.ok(video.muted, 'is muted');
});

test('volume', async function (t) {
  const video = await createVideoElement();
  await video.loadComplete;

  video.volume = 1;
  await delay(100); // postMessage is not instant
  t.equal(video.volume, 1, 'is all turned up. volume: ' + video.volume);
  video.volume = 0.5;
  await delay(100); // postMessage is not instant
  t.equal(video.volume, 0.5, 'is half volume');
});

test('loop', async function (t) {
  const video = await createVideoElement();
  await video.loadComplete;

  t.ok(!video.loop, 'loop is false by default');
  video.loop = true;
  t.ok(video.loop, 'loop is true');
});

test('duration', async function (t) {
  const video = await createVideoElement();
  await video.loadComplete;

  if (video.duration == null || Number.isNaN(video.duration)) {
    await promisify(video.addEventListener.bind(video))('durationchange');
  }

  t.equal(Math.round(video.duration), 115, `is 115s long`);
});

test('load promise', async function (t) {
  const video = await createVideoElement();
  await video.loadComplete;

  const loadComplete = video.loadComplete;

  video.src = 'https://wesleyluyten.wistia.com/medias/1ekn652fs5';
  await video.loadComplete;

  t.ok(
    loadComplete !== video.loadComplete,
    'creates a new promise after new src'
  );

  if (video.duration == null || Number.isNaN(video.duration)) {
    await promisify(video.addEventListener.bind(video))('durationchange');
  }

  t.equal(Math.round(video.duration), 90, `is 90s long`);
});

test('play promise', async function (t) {
  const video = await createVideoElement();
  await video.loadComplete;

  video.muted = true;

  try {
    await video.play();
  } catch (error) {
    console.warn(error);
  }
  t.ok(!video.paused, 'is playing after video.play()');
});

test('passes config into Wistia options', async function (t) {
  const previousWistia = globalThis.Wistia;
  const previousWq = globalThis._wq;

  try {
    globalThis.Wistia = {};

    const fakeApi = {
      elem: () => document.createElement('video'),
      duration: () => 0,
      play: () => {},
      bigPlayButtonEnabled: () => {},
      releaseChromeless: () => {},
      requestChromeless: () => {},
    };

    let pushed;
    globalThis._wq = {
      push: (payload) => {
        pushed = payload;
        payload.onReady(fakeApi);
      },
    };

    const video = await fixture(`<wistia-video controls muted></wistia-video>`);

    // Ensure user config takes precedence over element-derived defaults.
    video.config = {
      chromeless: true,
      playButton: false,
      playerColor: 'ff0000',
    };

    video.src = 'https://wesleyluyten.wistia.com/medias/oifkgmxnkb';
    await video.loadComplete;

    t.ok(pushed?.options, 'push payload includes options');
    t.equal(pushed.options.chromeless, true, 'config overrides default chromeless');
    t.equal(pushed.options.playButton, false, 'config overrides default playButton');
    t.equal(pushed.options.playerColor, 'ff0000', 'config is forwarded into options');
  } finally {
    globalThis.Wistia = previousWistia;
    globalThis._wq = previousWq;
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
