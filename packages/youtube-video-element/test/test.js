import { test } from 'zora';

function createVideoElement() {
  return fixture(`<youtube-video
    src="https://www.youtube.com/watch?v=H3KSKS3TTbc"
    muted
  ></youtube-video>`);
}

test('has default video props', async function (t) {
  const video = await createVideoElement();

  t.equal(video.paused, true, 'is paused on initialization');

  await video.loadComplete;

  t.equal(video.paused, true, 'is paused on initialization');
  t.ok(!video.ended, 'is not ended');
  t.ok(video.muted, 'is muted');
});

test('seeking while paused stays paused', async function (t) {
  const video = await createVideoElement();

  t.equal(video.paused, true, 'is paused on initialization');

  await video.loadComplete;

  video.currentTime = 23;
  await promisify(video.addEventListener.bind(video))('seeked');

  await delay(300); // postMessage is not instant
  t.equal(video.paused, true, 'is paused after seek');
  t.equal(Math.floor(video.currentTime), 23);
});

test('seeking while playing stays playing', async function (t) {
  const video = await createVideoElement();

  t.equal(video.paused, true, 'is paused on initialization');

  await video.loadComplete;

  try {
    await video.play();
  } catch (error) {
    console.warn(error);
  }
  t.ok(!video.paused, 'is playing after video.play()');

  video.currentTime = 23;
  await promisify(video.addEventListener.bind(video))('seeked');

  await delay(300); // postMessage is not instant
  t.ok(!video.paused, 'is playing after seek');
  t.equal(Math.floor(video.currentTime), 23);
});

test('volume', async function (t) {
  const video = await createVideoElement();
  await video.loadComplete;

  video.volume = 1;
  await delay(100); // postMessage is not instant
  t.equal(video.volume, 1, 'is all turned up. volume: ' + video.volume);
  video.volume = 0.5;
  await delay(700); // postMessage is not instant
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

  t.equal(Math.round(video.duration), 254, `is 254s long`);
});

test('load promise', async function (t) {
  const video = await createVideoElement();
  await video.loadComplete;

  const loadComplete = video.loadComplete;

  video.src = 'https://www.youtube.com/watch?v=C7dPqrmDWxs';
  await video.loadComplete;

  t.ok(
    loadComplete != video.loadComplete,
    'creates a new promise after new src'
  );

  if (video.duration == null || Number.isNaN(video.duration)) {
    await promisify(video.addEventListener.bind(video))('durationchange');
  }

  t.equal(Math.round(video.duration), 235, `is 235s long`);
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
