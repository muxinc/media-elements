import { test } from 'zora';

function createVideoElement(src = 'https://vimeo.com/76979871') {
  return fixture(`<vimeo-video
    src="${src}"
    muted
  ></vimeo-video>`);
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

  t.equal(Math.round(video.duration), 62, `is 62s long`);
});

test('load promise', async function (t) {
  const video = await createVideoElement();
  await video.loadComplete;

  const loadComplete = video.loadComplete;

  video.src = 'https://vimeo.com/22439234';
  await video.loadComplete;

  t.ok(
    loadComplete != video.loadComplete,
    'creates a new promise after new src'
  );

  if (video.duration == null || Number.isNaN(video.duration)) {
    await promisify(video.addEventListener.bind(video))('durationchange');
  }

  t.equal(Math.round(video.duration), 185, `is 185s long`);
});

test('play promise', async function (t) {
  // 76979871 fails to play with a Vimeo PlaybackError, so use a playable video.
  const video = await createVideoElement('https://vimeo.com/22439234');
  await video.loadComplete;

  video.muted = true;

  try {
    await video.play();
  } catch (error) {
    console.warn(error);
  }
  t.ok(!video.paused, 'is playing after video.play()');
});

test('pause() before load completes keeps paused in sync', async function (t) {
  const video = await createVideoElement('https://vimeo.com/22439234');

  let playEvents = 0;
  let pauseEvents = 0;
  video.addEventListener('play', () => playEvents++);
  video.addEventListener('pause', () => pauseEvents++);

  video.play().catch(() => {});
  video.pause();

  t.equal(video.paused, true, 'is paused synchronously after pause()');
  t.equal(pauseEvents, 1, 'dispatches a pause event');

  await video.loadComplete;
  await delay(3000);

  t.equal(video.paused, true, 'is still paused after load');
  t.equal(await video.api.getPaused(), true, 'matches the Vimeo player state');
  t.equal(playEvents, 1, 'does not dispatch another play event after load');
  t.equal(pauseEvents, 1, 'does not dispatch a duplicate pause event');
});

test('dispatches an error event when the video does not exist', async function (t) {
  const video = await fixture(`<vimeo-video
    src="https://vimeo.com/585758234/1ef30fd6da"
    muted
  ></vimeo-video>`);

  const event = await new Promise((resolve) => video.addEventListener('error', resolve, { once: true }));

  t.ok(event instanceof ErrorEvent, 'is an ErrorEvent');
  t.equal(event.error?.name, 'NotFoundError', 'carries the Vimeo error');
  t.ok(event.message, 'has an error message');
  t.equal(video.error, event.error, 'exposes the error via video.error');
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
