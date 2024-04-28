import { test } from 'zora';

function createVideoElement() {
  return fixture(`<dash-video
    src="https://player.vimeo.com/external/648359100.mpd?s=a4419a2e2113cc24a87aef2f93ef69a8e4c8fb0c&ext=.mpd"
    muted
  ></dash-video>`);
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
  video.src = 'https://player.vimeo.com/external/638371504.mpd?s=d154aa431bb3980bd039a7e2b1c389353ce44fdb&logging=false&ext=.mpd';

  if (video.duration == null || Number.isNaN(video.duration)) {
    await promisify(video.addEventListener.bind(video))('durationchange');
  }

  t.equal(Math.round(video.duration), 90, `is 90s long`);
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
