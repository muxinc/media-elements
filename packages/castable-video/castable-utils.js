/* global WeakRef */

export const privateProps = new WeakMap();

export class InvalidStateError extends Error {}
export class NotSupportedError extends Error {}
export class NotFoundError extends Error {}

const HLS_RESPONSE_HEADERS = ['application/x-mpegURL','application/vnd.apple.mpegurl','audio/mpegurl']

// Fallback to a plain Set if WeakRef is not available.
export const IterableWeakSet = globalThis.WeakRef ?
  class extends Set {
    add(el) {
      super.add(new WeakRef(el));
    }
    forEach(fn) {
      super.forEach((ref) => {
        const value = ref.deref();
        if (value) fn(value);
      });
    }
  } : Set;

export function onCastApiAvailable(callback) {
  if (!globalThis.chrome?.cast?.isAvailable) {
    globalThis.__onGCastApiAvailable = () => {
      // The globalThis.__onGCastApiAvailable callback alone is not reliable for
      // the added cast.framework. It's loaded in a separate JS file.
      // https://www.gstatic.com/eureka/clank/101/cast_sender.js
      // https://www.gstatic.com/cast/sdk/libs/sender/1.0/cast_framework.js
      customElements
        .whenDefined('google-cast-button')
        .then(callback);
    };
  } else if (!globalThis.cast?.framework) {
    customElements
      .whenDefined('google-cast-button')
      .then(callback);
  } else {
    callback();
  }
}

export function requiresCastFramework() {
  // todo: exclude for Android>=56 which supports the Remote Playback API natively.
  return globalThis.chrome;
}

export function loadCastFramework() {
  const sdkUrl = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
  if (globalThis.chrome?.cast || document.querySelector(`script[src="${sdkUrl}"]`)) return;

  const script = document.createElement('script');
  script.src = sdkUrl;
  document.head.append(script);
}

export function castContext() {
  return globalThis.cast?.framework?.CastContext.getInstance();
}

export function currentSession() {
  return castContext()?.getCurrentSession();
}

export function currentMedia() {
  return currentSession()?.getSessionObj().media[0];
}

export function editTracksInfo(request) {
  return new Promise((resolve, reject) => {
    currentMedia().editTracksInfo(request, resolve, reject);
  });
}

export function getMediaStatus(request) {
  return new Promise((resolve, reject) => {
    currentMedia().getStatus(request, resolve, reject);
  });
}

export function setCastOptions(options) {
  return castContext().setOptions({
    ...getDefaultCastOptions(),
    ...options,
  });
}

export function getDefaultCastOptions() {
  return {
    // Set the receiver application ID to your own (created in the
    // Google Cast Developer Console), or optionally
    // use the chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
    receiverApplicationId: 'CC1AD845',

    // Auto join policy can be one of the following three:
    // ORIGIN_SCOPED - Auto connect from same appId and page origin
    // TAB_AND_ORIGIN_SCOPED - Auto connect from same appId, page origin, and tab
    // PAGE_SCOPED - No auto connect
    autoJoinPolicy: 'origin_scoped',

    // The following flag enables Cast Connect(requires Chrome 87 or higher)
    // https://developers.googleblog.com/2020/08/introducing-cast-connect-android-tv.html
    androidReceiverCompatible: false,

    language: 'en-US',
    resumeSavedSession: true,
  };
}

//Get the segment format given the end of the URL (.m4s, .ts, etc)
function getFormat(segment) {
  if (!segment) return undefined;

  const regex = /\.([a-zA-Z0-9]+)(?:\?.*)?$/;
  const match = segment.match(regex);
  return match ? match[1] : null;
}

function parsePlaylistUrls(playlistContent) {
  const lines = playlistContent.split('\n');
  const urls = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Locate available video playlists and get the next line which is the URI (https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis-17#section-4.4.6.2)
    if (line.startsWith('#EXT-X-STREAM-INF')) {
      const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
      if (nextLine && !nextLine.startsWith('#')) {
        urls.push(nextLine);
      }
    }
  }

  return urls;
}

function parseSegment(playlistContent){
  const lines = playlistContent.split('\n');

  const url = lines.find(line => !line.trim().startsWith('#') && line.trim() !== '');

  return url;
}

export async function isHls(url) {
  try {
    const response = await fetch(url, {method: 'HEAD'});
    const contentType = response.headers.get('Content-Type');

    return HLS_RESPONSE_HEADERS.some((header) => contentType === header);
  } catch (err) {
    console.error('Error while trying to get the Content-Type of the manifest', err);
    return false;
  }
}

export async function getPlaylistSegmentFormat(url) {
  try {
    const mainManifestContent = await (await fetch(url)).text();
    let availableChunksContent = mainManifestContent;

    const playlists = parsePlaylistUrls(mainManifestContent);
    if (playlists.length > 0) {    
      const chosenPlaylistUrl = new URL(playlists[0], url).toString();
      availableChunksContent = await (await fetch(chosenPlaylistUrl)).text();
    }

    const segment = parseSegment(availableChunksContent);
    const format = getFormat(segment);
    return format
  } catch (err) {
    console.error('Error while trying to parse the manifest playlist', err);
    return undefined;
  }
}