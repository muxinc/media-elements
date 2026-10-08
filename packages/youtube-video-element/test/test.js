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

test('destroys the player when disconnected', async function (t) {
  const video = await createVideoElement();
  await video.loadComplete;

  t.ok(video.api, 'has a player once loaded');
  t.ok(video.shadowRoot.querySelector('iframe'), 'has an iframe once loaded');

  video.remove();

  t.equal(video.api, null, 'the player reference is released on disconnect');
  t.equal(video.isLoaded, false, 'the element is no longer marked loaded');
  t.equal(
    video.shadowRoot.querySelector('iframe'),
    null,
    'destroy() removed the iframe from the shadow root'
  );
});

test('creates a new player when reconnected', async function (t) {
  const video = await createVideoElement();
  await video.loadComplete;

  const firstApi = video.api;
  video.remove();
  document.body.append(video);

  await video.loadComplete;

  t.ok(video.api, 'has a player again after reconnecting');
  t.ok(video.api !== firstApi, 'a new player was created, not the destroyed one');
  t.ok(video.shadowRoot.querySelector('iframe'), 'the iframe was rebuilt');
});

test('disconnecting mid-load does not build a player afterwards', async function (t) {
  const video = await createVideoElement();
  // Disconnect while load() is still awaiting the API script.
  video.remove();

  // Let that in-flight continuation actually resume before asserting;
  // immediately after remove() api === null is true by construction.
  for (let i = 0; i < 500 && !globalThis.YT?.Player; i++) await delay(10);
  await delay(100);

  t.equal(video.api, null, 'the superseded load did not construct a player');
});

test('disconnecting before ready settles the pending loadComplete', async function (t) {
  const video = await createVideoElement();
  const pending = video.loadComplete;

  // Disconnect after the player is constructed but before onReady fires.
  for (let i = 0; i < 500 && !video.api; i++) await delay(10);
  video.remove();

  const outcome = await Promise.race([
    pending.then(() => 'resolved', (err) => err.name),
    delay(3000).then(() => 'pending'),
  ]);
  t.ok(outcome !== 'pending', `loadComplete settles after disconnect (${outcome})`);
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
