/* global WeakRef */

export const privateProps = new WeakMap();

export class InvalidStateError extends Error {}
export class NotSupportedError extends Error {}
export class NotFoundError extends Error {}

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
