import { test } from 'zora';

function createVideoElement() {
  return fixture(`<youtube-video
    src="https://www.youtube.com/watch?v=H3KSKS3TTbc"
    muted
  ></youtube-video>`);
}

function createPlaylistElement() {
  return fixture(`<youtube-video  
    src="https://www.youtube.com/playlist?list=PLRfhDHeBTBJ7MU5DX4P_oBIRN457ah9lA"
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

test('playlist', async function (t) {
  const playlist = await createPlaylistElement();
  await playlist.loadComplete;

  t.equal(playlist.paused, true, 'is paused on initialization');
  t.ok(!playlist.ended, 'is not ended');
  t.ok(playlist.muted, 'is muted');

  if (playlist.duration == null || Number.isNaN(playlist.duration)) {
    await promisify(playlist.addEventListener.bind(playlist))('durationchange');
  }

  t.ok(playlist.duration > 0, `has a duration of ${playlist.duration}`);
});

test('t parameter - basic seconds', async function (t) {
  const video = await fixture(`<youtube-video
    src="https://www.youtube.com/watch?v=H3KSKS3TTbc&t=171"
    muted
  ></youtube-video>`);
  
  await video.loadComplete;
  
  const iframe = video.shadowRoot.querySelector('iframe');
  const iframeUrl = new URL(iframe.src);
  const startParam = iframeUrl.searchParams.get('start');
  
  t.equal(startParam, '171', 'start parameter is set to 171 seconds');
});

test('t parameter - youtu.be format', async function (t) {
  const video = await fixture(`<youtube-video
    src="https://youtu.be/H3KSKS3TTbc?t=171"
    muted
  ></youtube-video>`);
  
  await video.loadComplete;
  
  const iframe = video.shadowRoot.querySelector('iframe');
  const iframeUrl = new URL(iframe.src);
  const startParam = iframeUrl.searchParams.get('start');
  
  t.equal(startParam, '171', 'start parameter is set to 171 seconds from youtu.be URL');
});

test('t parameter - with seconds suffix', async function (t) {
  const video = await fixture(`<youtube-video
    src="https://www.youtube.com/watch?v=H3KSKS3TTbc&t=171s"
    muted
  ></youtube-video>`);
  
  await video.loadComplete;
  
  const iframe = video.shadowRoot.querySelector('iframe');
  const iframeUrl = new URL(iframe.src);
  const startParam = iframeUrl.searchParams.get('start');
  
  t.equal(startParam, '171', 'start parameter is set to 171 seconds from t=171s');
});

test('t parameter - minutes and seconds', async function (t) {
  const video = await fixture(`<youtube-video
    src="https://www.youtube.com/watch?v=H3KSKS3TTbc&t=2m51s"
    muted
  ></youtube-video>`);
  
  await video.loadComplete;
  
  const iframe = video.shadowRoot.querySelector('iframe');
  const iframeUrl = new URL(iframe.src);
  const startParam = iframeUrl.searchParams.get('start');
  
  t.equal(startParam, '171', 'start parameter is set to 171 seconds from t=2m51s (2*60 + 51)');
});

test('t parameter - minutes only', async function (t) {
  const video = await fixture(`<youtube-video
    src="https://www.youtube.com/watch?v=H3KSKS3TTbc&t=3m"
    muted
  ></youtube-video>`);
  
  await video.loadComplete;
  
  const iframe = video.shadowRoot.querySelector('iframe');
  const iframeUrl = new URL(iframe.src);
  const startParam = iframeUrl.searchParams.get('start');
  
  t.equal(startParam, '180', 'start parameter is set to 180 seconds from t=3m (3*60)');
});

test('t parameter - no t parameter', async function (t) {
  const video = await fixture(`<youtube-video
    src="https://www.youtube.com/watch?v=H3KSKS3TTbc"
    muted
  ></youtube-video>`);
  
  await video.loadComplete;
  
  const iframe = video.shadowRoot.querySelector('iframe');
  const iframeUrl = new URL(iframe.src);
  const startParam = iframeUrl.searchParams.get('start');
  
  t.equal(startParam, null, 'start parameter is not set when t parameter is absent');
});

test('t parameter - case insensitive', async function (t) {
  const video = await fixture(`<youtube-video
    src="https://www.youtube.com/watch?v=H3KSKS3TTbc&T=171"
    muted
  ></youtube-video>`);
  
  await video.loadComplete;
  
  const iframe = video.shadowRoot.querySelector('iframe');
  const iframeUrl = new URL(iframe.src);
  const startParam = iframeUrl.searchParams.get('start');
  
  t.equal(startParam, '171', 'start parameter is set from uppercase T parameter');
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
