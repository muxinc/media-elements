import { test } from 'zora';

function createAudioElement() {
  return fixture(`<spotify-audio
    src="https://open.spotify.com/artist/246dkjvS1zLTtiykXe5h60"
    muted
  ></spotify-audio>`);
}

test('has default audio props', async function (t) {
  const audio = await createAudioElement();

  t.equal(audio.paused, true, 'is paused on initialization');

  await audio.loadComplete;

  t.equal(audio.paused, true, 'is paused on initialization');
  t.ok(!audio.ended, 'is not ended');
  // t.ok(audio.muted, 'is muted');
});

test('loop', async function (t) {
  const audio = await createAudioElement();
  await audio.loadComplete;

  t.ok(!audio.loop, 'loop is false by default');
  audio.loop = true;
  t.ok(audio.loop, 'loop is true');
});

// test('duration', async function (t) {
//   const audio = await createAudioElement();
//   await audio.loadComplete;

//   if (audio.duration == null || Number.isNaN(audio.duration)) {
//     await promisify(audio.addEventListener.bind(audio))('durationchange');
//   }

//   t.equal(Math.round(audio.duration), 115, `is 115s long`);
// });

// test('load promise', async function (t) {
//   const audio = await createAudioElement();
//   await audio.loadComplete;

//   const loadComplete = audio.loadComplete;

//   audio.src = 'https://vimeo.com/638371504';
//   await audio.loadComplete;

//   t.ok(
//     loadComplete != audio.loadComplete,
//     'creates a new promise after new src'
//   );

//   if (audio.duration == null || Number.isNaN(audio.duration)) {
//     await promisify(audio.addEventListener.bind(audio))('durationchange');
//   }

//   t.equal(Math.round(audio.duration), 90, `is 90s long`);
// });

// test('play promise', async function (t) {
//   const audio = await createAudioElement();
//   await audio.loadComplete;

//   audio.muted = true;

//   try {
//     await audio.play();
//   } catch (error) {
//     console.warn(error);
//   }
//   t.ok(!audio.paused, 'is playing after audio.play()');
// });

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
