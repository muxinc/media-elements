import { test } from 'zora';

import '../dist/global.js';
import { MediaTracksMixin } from '../dist/mixin.js';
import {
  VideoTrackList,
  VideoRenditionList,
  AudioTrackList,
  AudioRenditionList
} from '../dist/index.js';

MediaTracksMixin(globalThis.HTMLMediaElement);

test('adding methods to simple class', async function (t) {
  class Super {}
  const Sub = MediaTracksMixin(Super);
  t.ok(Sub.prototype.videoTracks instanceof VideoTrackList);

  const obj = new Sub();
  t.ok(obj.videoTracks instanceof VideoTrackList);
});

test('is an instance of VideoTrackList', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  t.ok(video.videoTracks instanceof VideoTrackList);
});

test('is an instance of AudioTrackList', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  t.ok(video.audioTracks instanceof AudioTrackList);
});

test('is an instance of VideoRenditionList', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  t.ok(video.videoRenditions instanceof VideoRenditionList);
});

test('is an instance of AudioRenditionList', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  t.ok(video.audioRenditions instanceof AudioRenditionList);
});

test('get video track with getTrackById', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track1 = video.addVideoTrack('main');
  track1.id = "1";
  const track2 = video.addVideoTrack('alternative');
  track2.id = "2";
  t.equal(video.videoTracks.getTrackById("1"), track1);
  t.equal(video.videoTracks.getTrackById("2"), track2);
});

test('get audio track with getTrackById', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track1 = video.addAudioTrack('main');
  track1.id = "1";
  const track2 = video.addAudioTrack('alternative');
  track2.id = "2";
  t.equal(video.audioTracks.getTrackById("1"), track1);
  t.equal(video.audioTracks.getTrackById("2"), track2);
});

test('fires queued addtrack event on video tracks', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addVideoTrack('sign');
  const event = await oneEvent(video.videoTracks, 'addtrack');
  t.equal(track, event.track, 'same event track');
  t.equal(video.videoTracks.length, 1);
  t.equal(video.videoTracks.selectedIndex, -1);
  t.equal(track, video.videoTracks[0], 'same index track');
  t.equal(track, [...video.videoTracks][0], 'same iterator track');
});

test('fires queued removetrack event', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addVideoTrack('main');
  video.removeVideoTrack(track);
  const event = await oneEvent(video.videoTracks, 'removetrack');
  t.equal(track, event.track);
  t.equal(video.videoTracks.length, 0);
});

test('fires batched change event on selected video track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const main = video.addVideoTrack('main');
  main.selected = true;
  const sign = video.addVideoTrack('sign');
  const commentary = video.addVideoTrack('commentary');

  sign.selected = true;
  commentary.selected = true;

  await oneEvent(video.videoTracks, 'change');
  t.ok(commentary.selected);
  t.ok(!sign.selected);
  t.ok(!main.selected);
});

test('fires queued addrendition event on selected video track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addVideoTrack('main');
  track.selected = true;
  t.equal(video.videoTracks.selectedIndex, 0);
  const rendition = track.addRendition('https://', 1920, 1080);
  const event = await oneEvent(video.videoRenditions, 'addrendition');
  t.equal(rendition, event.rendition);
  t.equal(video.videoRenditions.length, 1);
  t.equal(video.videoRenditions.selectedIndex, -1);
  t.equal(rendition, video.videoRenditions[0]);
  t.equal(rendition, [...video.videoRenditions][0]);
});

test('fires queued addrendition event on enabled audio track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addAudioTrack('main');
  track.enabled = true;
  const rendition = track.addRendition('https://', 'aac');
  const event = await oneEvent(video.audioRenditions, 'addrendition');
  t.equal(rendition, event.rendition);
  t.equal(video.audioRenditions.length, 1);
  t.equal(video.audioRenditions.selectedIndex, -1);
  t.equal(rendition, video.audioRenditions[0]);
  t.equal(rendition, [...video.audioRenditions][0]);
});

test('fires no addrendition event on unselected video track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addVideoTrack('main');

  track.addRendition('https://', 1920, 1080);
  await Promise.race([
    oneEvent(video.videoRenditions, 'addrendition'),
    delay(200)
  ]);

  t.equal(video.videoRenditions.length, 0);
});

test('fires no addrendition event on unenabled audio track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addAudioTrack('main');

  track.addRendition('https://');
  await Promise.race([
    oneEvent(video.audioRenditions, 'addrendition'),
    delay(200)
  ]);

  t.equal(video.audioRenditions.length, 0);
});

test('fires queued removerendition event on selected video track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addVideoTrack('main');
  track.selected = true;
  track.addRendition('https://', 1920, 1080);
  const rendition = track.addRendition('https://', 1920, 1080);
  track.removeRendition(rendition);
  const event = await oneEvent(video.videoRenditions, 'removerendition');
  t.equal(rendition, event.rendition);
  t.equal(video.videoRenditions.length, 1);
});

test('fires queued removerendition event on enabled audio track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addAudioTrack('main');
  track.enabled = true;
  track.addRendition('https://');
  const rendition = track.addRendition('https://');
  track.removeRendition(rendition);
  const event = await oneEvent(video.audioRenditions, 'removerendition');
  t.equal(rendition, event.rendition);
  t.equal(video.audioRenditions.length, 1);
});

test('fires batched change event on selected video rendition', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addVideoTrack('main');
  track.selected = true;
  const r0 = track.addRendition('https://', 1920, 1080);
  const r1 = track.addRendition('https://', 1280, 720);

  video.videoRenditions.selectedIndex = 0;
  video.videoRenditions.selectedIndex = 1;
  video.videoRenditions.selectedIndex = 0;

  await oneEvent(video.videoRenditions, 'change');
  t.ok(r0.selected);
  t.ok(!r1.selected);
});

test('fires batched change event on selected audio rendition', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addAudioTrack('main');
  track.enabled = true;
  const r0 = track.addRendition('https://', 'aac');
  const r1 = track.addRendition('https://', 'opus');

  video.audioRenditions.selectedIndex = 0;
  video.audioRenditions.selectedIndex = 1;
  video.audioRenditions.selectedIndex = 0;

  await oneEvent(video.audioRenditions, 'change');
  t.ok(r0.selected);
  t.ok(!r1.selected);
});

test('renditions of removed selected video tracks are not listed', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);

  const track = video.addVideoTrack('main');
  track.selected = true;
  track.addRendition('https://', 1920, 1080);
  track.addRendition('https://', 1280, 720);
  t.equal(video.videoRenditions.length, 2);

  video.removeVideoTrack(track);

  const track2 = video.addVideoTrack('commentary');
  track2.selected = true;
  t.equal(video.videoTracks.length, 1);

  track2.addRendition('https://', 1920, 1080);
  track2.addRendition('https://', 1280, 720);

  t.equal(video.videoRenditions.length, 2);
});

test('renditions of removed enabled audio tracks are not listed', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);

  const track = video.addAudioTrack('main');
  track.enabled = true;
  track.addRendition('https://', 'aac');
  track.addRendition('https://', 'opus');
  t.equal(video.audioRenditions.length, 2);

  video.removeAudioTrack(track);

  const track2 = video.addAudioTrack('commentary');
  track2.enabled = true;
  t.equal(video.audioTracks.length, 1);

  track2.addRendition('https://', 'aac');
  track2.addRendition('https://', 'opus');

  t.equal(video.audioRenditions.length, 2);
});

test('fires queued addrendition callback on enabled audio track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addAudioTrack('main');
  track.enabled = true;
  await new Promise(resolve => (video.audioTracks.onaddtrack = resolve));
  track.addRendition('https://', 'aac');
  await new Promise(resolve => (video.audioRenditions.onaddrendition = resolve));
  t.ok(true);
});

test('fires queued addrendition callback on selected video track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addVideoTrack('main');
  track.selected = true;
  await new Promise(resolve => (video.videoTracks.onaddtrack = resolve));
  track.addRendition('https://', 1920, 1080);
  await new Promise(resolve => (video.videoRenditions.onaddrendition = resolve));
  t.ok(true);
});

test('fires queued removerendition callback on selected video track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addVideoTrack('main');
  track.selected = true;
  await new Promise(resolve => (video.videoTracks.onaddtrack = resolve));
  track.addRendition('https://', 1920, 1080);
  const rendition = track.addRendition('https://', 1920, 1080);
  track.removeRendition(rendition);
  await new Promise(resolve => (video.videoRenditions.onremoverendition = resolve));
  t.ok(true);
});

test('fires queued removerendition callback on enabled audio track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addAudioTrack('main');
  track.enabled = true;
  await new Promise(resolve => (video.audioTracks.onaddtrack = resolve));
  const rendition = track.addRendition('https://', 'aac');
  track.removeRendition(rendition);
  await new Promise(resolve => (video.audioRenditions.onremoverendition = resolve));
  t.ok(true);
});

test('fires queued removetrack callback on selected video track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addVideoTrack('main');
  track.selected = true;
  video.removeVideoTrack(track);
  await new Promise(resolve => (video.videoTracks.onremovetrack = resolve));
  t.ok(true);
});

test('fires queued removetrack callback on enabled audio track', async function (t) {
  /** @type {HTMLVideoElement} */
  const video = await fixture(`<video></video>`);
  const track = video.addAudioTrack('main');
  track.enabled = true;
  video.removeAudioTrack(track);
  await new Promise(resolve => (video.audioTracks.onremovetrack = resolve));
  t.ok(true);
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function oneEvent(target, type) {
  return new Promise(resolve => {
    function handler(event) {
      target.removeEventListener(type, handler);
      resolve(event);
    }
    target.addEventListener(type, handler);
  });
}
