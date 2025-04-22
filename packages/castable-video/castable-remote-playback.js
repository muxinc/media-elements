/* global chrome, cast */
import {
  privateProps,
  IterableWeakSet,
  InvalidStateError,
  NotSupportedError,
  onCastApiAvailable,
  castContext,
  currentSession,
  currentMedia,
  editTracksInfo,
  getMediaStatus,
  setCastOptions
} from './castable-utils.js';

const remoteInstances = new IterableWeakSet();
const castElementRef = new WeakSet();

let cf;

onCastApiAvailable(() => {
  if (!globalThis.chrome?.cast?.isAvailable) {
    // Useful to see in verbose logs if this shows undefined or false.
    console.debug('chrome.cast.isAvailable', globalThis.chrome?.cast?.isAvailable);
    return;
  }

  if (!cf) {
    cf = cast.framework;

    castContext().addEventListener(cf.CastContextEventType.CAST_STATE_CHANGED, (e) => {
      remoteInstances.forEach((r) => privateProps.get(r).onCastStateChanged?.(e));
    });

    castContext().addEventListener(cf.CastContextEventType.SESSION_STATE_CHANGED, (e) => {
      remoteInstances.forEach((r) => privateProps.get(r).onSessionStateChanged?.(e));
    });

    remoteInstances.forEach((r) => privateProps.get(r).init?.());
  }
});


let remotePlaybackCallbackIdCount = 0;

/**
 * Remote Playback shim for the Google cast SDK.
 * https://w3c.github.io/remote-playback/
 */
export class RemotePlayback extends EventTarget {
  #media;
  #isInit;
  #remotePlayer;
  #remoteListeners;
  #state = 'disconnected';
  #available = false;
  #callbacks = new Set();
  #callbackIds = new WeakMap();

  constructor(media) {
    super();

    this.#media = media;

    remoteInstances.add(this);
    privateProps.set(this, {
      init: () => this.#init(),
      onCastStateChanged: () => this.#onCastStateChanged(),
      onSessionStateChanged: () => this.#onSessionStateChanged(),
      getCastPlayer: () => this.#castPlayer,
    });

    this.#init();
  }

  get #castPlayer() {
    if (castElementRef.has(this.#media)) return this.#remotePlayer;
    return undefined;
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/API/RemotePlayback/state
   * @return {'disconnected'|'connecting'|'connected'}
   */
  get state() {
    return this.#state;
  }

  async watchAvailability(callback) {
    if (this.#media.disableRemotePlayback) {
      throw new InvalidStateError('disableRemotePlayback attribute is present.');
    }

    this.#callbackIds.set(callback, ++remotePlaybackCallbackIdCount);
    this.#callbacks.add(callback);

    return remotePlaybackCallbackIdCount;
  }

  async cancelWatchAvailability(callback) {
    if (this.#media.disableRemotePlayback) {
      throw new InvalidStateError('disableRemotePlayback attribute is present.');
    }

    if (callback) {
      this.#callbacks.delete(callback);
    } else {
      this.#callbacks.clear();
    }
  }

  async prompt() {
    if (this.#media.disableRemotePlayback) {
      throw new InvalidStateError('disableRemotePlayback attribute is present.');
    }

    if (!globalThis.chrome?.cast?.isAvailable) {
      throw new NotSupportedError('The RemotePlayback API is disabled on this platform.');
    }

    const willDisconnect = castElementRef.has(this.#media);
    castElementRef.add(this.#media);

    setCastOptions(this.#media.castOptions);

    Object.entries(this.#remoteListeners).forEach(([event, listener]) => {
      this.#remotePlayer.controller.addEventListener(event, listener);
    });

    try {
      // Open browser cast menu.
      await castContext().requestSession();
    } catch (err) {
      // If there will be no disconnect, reset some state here.
      if (!willDisconnect) {
        castElementRef.delete(this.#media);
      }

      // Don't throw an error if disconnecting or cancelling.
      if (err === 'cancel') {
        return;
      }

      throw new Error(err);
    }

    privateProps.get(this.#media)?.loadOnPrompt?.();
  }

  #disconnect() {
    if (!castElementRef.has(this.#media)) return;

    Object.entries(this.#remoteListeners).forEach(([event, listener]) => {
      this.#remotePlayer.controller.removeEventListener(event, listener);
    });

    castElementRef.delete(this.#media);

    // isMuted is not in savedPlayerState. should we sync this back to local?
    this.#media.muted = this.#remotePlayer.isMuted;
    this.#media.currentTime = this.#remotePlayer.savedPlayerState.currentTime;
    if (this.#remotePlayer.savedPlayerState.isPaused === false) {
      this.#media.play();
    }
  }

  #onCastStateChanged() {
    // Cast state: NO_DEVICES_AVAILABLE, NOT_CONNECTED, CONNECTING, CONNECTED
    // https://developers.google.com/cast/docs/reference/web_sender/cast.framework#.CastState
    const castState = castContext().getCastState();

    if (castElementRef.has(this.#media)) {
      if (castState === 'CONNECTING') {
        this.#state = 'connecting';
        this.dispatchEvent(new Event('connecting'));
      }
    }

    if (!this.#available && castState?.includes('CONNECT')) {
      this.#available = true;
      for (let callback of this.#callbacks) callback(true);
    }
    else if (this.#available && (!castState || castState === 'NO_DEVICES_AVAILABLE')) {
      this.#available = false;
      for (let callback of this.#callbacks) callback(false);
    }
  }

  async #onSessionStateChanged() {
    // Session states: NO_SESSION, SESSION_STARTING, SESSION_STARTED, SESSION_START_FAILED,
    //                 SESSION_ENDING, SESSION_ENDED, SESSION_RESUMED
    // https://developers.google.com/cast/docs/reference/web_sender/cast.framework#.SessionState

    const { SESSION_RESUMED } = cf.SessionState;
    if (castContext().getSessionState() === SESSION_RESUMED) {
      /**
       * Figure out if this was the video that started the resumed session.
       * @TODO make this more specific than just checking against the video src!! (WL)
       *
       * If this video element can get the same unique id on each browser refresh
       * it would be possible to pass this unique id w/ `LoadRequest.customData`
       * and verify against currentMedia().customData below.
       */
      if (this.#media.castSrc === currentMedia()?.media.contentId) {
        castElementRef.add(this.#media);

        Object.entries(this.#remoteListeners).forEach(([event, listener]) => {
          this.#remotePlayer.controller.addEventListener(event, listener);
        });

        /**
         * There is cast framework resume session bug when you refresh the page a few
         * times the this.#remotePlayer.currentTime will not be in sync with the receiver :(
         * The below status request syncs it back up.
         */
        try {
          await getMediaStatus(new chrome.cast.media.GetStatusRequest());
        } catch (error) {
          console.error(error);
        }

        // Dispatch the play, playing events manually to sync remote playing state.
        this.#remoteListeners[cf.RemotePlayerEventType.IS_PAUSED_CHANGED]();
        this.#remoteListeners[cf.RemotePlayerEventType.PLAYER_STATE_CHANGED]();
      }
    }
  }

  #init() {
    if (!cf || this.#isInit) return;
    this.#isInit = true;

    setCastOptions(this.#media.castOptions);

    /**
     * @TODO add listeners for addtrack, removetrack (WL)
     * This only has an impact on <track> with a `src` because these have to be
     * loaded manually in the load() method. This will require a new load() call
     * for each added/removed track w/ src.
     */
    this.#media.textTracks.addEventListener('change', () => this.#updateRemoteTextTrack());

    this.#onCastStateChanged();

    this.#remotePlayer = new cf.RemotePlayer();
    new cf.RemotePlayerController(this.#remotePlayer);

    this.#remoteListeners = {
      [cf.RemotePlayerEventType.IS_CONNECTED_CHANGED]: ({ value }) => {
        if (value === true) {
          this.#state = 'connected';
          this.dispatchEvent(new Event('connect'));
        } else {
          this.#disconnect();
          this.#state = 'disconnected';
          this.dispatchEvent(new Event('disconnect'));
        }
      },
      [cf.RemotePlayerEventType.DURATION_CHANGED]: () => {
        this.#media.dispatchEvent(new Event('durationchange'));
      },
      [cf.RemotePlayerEventType.VOLUME_LEVEL_CHANGED]: () => {
        this.#media.dispatchEvent(new Event('volumechange'));
      },
      [cf.RemotePlayerEventType.IS_MUTED_CHANGED]: () => {
        this.#media.dispatchEvent(new Event('volumechange'));
      },
      [cf.RemotePlayerEventType.CURRENT_TIME_CHANGED]: () => {
        if (!this.#castPlayer?.isMediaLoaded) return;
        this.#media.dispatchEvent(new Event('timeupdate'));
      },
      [cf.RemotePlayerEventType.VIDEO_INFO_CHANGED]: () => {
        this.#media.dispatchEvent(new Event('resize'));
      },
      [cf.RemotePlayerEventType.IS_PAUSED_CHANGED]: () => {
        this.#media.dispatchEvent(new Event(this.paused ? 'pause' : 'play'));
      },
      [cf.RemotePlayerEventType.PLAYER_STATE_CHANGED]: () => {
        // Player states: IDLE, PLAYING, PAUSED, BUFFERING
        // https://developers.google.com/cast/docs/reference/web_sender/chrome.cast.media#.PlayerState

        // pause event is handled above.
        if (this.#castPlayer?.playerState === chrome.cast.media.PlayerState.PAUSED) {
          return;
        }

        this.#media.dispatchEvent(
          new Event(
            {
              [chrome.cast.media.PlayerState.PLAYING]: 'playing',
              [chrome.cast.media.PlayerState.BUFFERING]: 'waiting',
              [chrome.cast.media.PlayerState.IDLE]: 'emptied',
            }[this.#castPlayer?.playerState]
          )
        );
      },
      [cf.RemotePlayerEventType.IS_MEDIA_LOADED_CHANGED]: async () => {
        if (!this.#castPlayer?.isMediaLoaded) return;

        // mediaInfo is not immediately available due to a bug? wait one tick
        await Promise.resolve();
        this.#onRemoteMediaLoaded();
      },
    };
  }

  #onRemoteMediaLoaded() {
    this.#updateRemoteTextTrack();
  }

  async #updateRemoteTextTrack() {
    if (!this.#castPlayer) return;

    // Get the tracks w/ trackId's that have been loaded; manually or via a playlist like a M3U8 or MPD.
    const remoteTracks = this.#remotePlayer.mediaInfo?.tracks ?? [];
    const remoteSubtitles = remoteTracks.filter(
      ({ type }) => type === chrome.cast.media.TrackType.TEXT
    );

    const localSubtitles = [...this.#media.textTracks].filter(
      ({ kind }) => kind === 'subtitles' || kind === 'captions'
    );

    // Create a new array from the local subs w/ the trackId's from the remote subs.
    const subtitles = remoteSubtitles
      .map(({ language, name, trackId }) => {
        // Find the corresponding local text track and assign the trackId.
        const { mode } =
          localSubtitles.find(
            (local) => local.language === language && local.label === name
          ) ?? {};
        if (mode) return { mode, trackId };
        return false;
      })
      .filter(Boolean);

    const hiddenSubtitles = subtitles.filter(
      ({ mode }) => mode !== 'showing'
    );
    const hiddenTrackIds = hiddenSubtitles.map(({ trackId }) => trackId);
    const showingSubtitle = subtitles.find(({ mode }) => mode === 'showing');

    // Note this could also include audio or video tracks, diff against local state.
    const activeTrackIds =
      currentSession()?.getSessionObj().media[0]
        ?.activeTrackIds ?? [];
    let requestTrackIds = activeTrackIds;

    if (activeTrackIds.length) {
      // Filter out all local hidden subtitle trackId's.
      requestTrackIds = requestTrackIds.filter(
        (id) => !hiddenTrackIds.includes(id)
      );
    }

    if (showingSubtitle?.trackId) {
      requestTrackIds = [...requestTrackIds, showingSubtitle.trackId];
    }

    // Remove duplicate ids.
    requestTrackIds = [...new Set(requestTrackIds)];

    const arrayEquals = (a, b) =>
      a.length === b.length && a.every((a) => b.includes(a));
    if (!arrayEquals(activeTrackIds, requestTrackIds)) {
      try {
        const request = new chrome.cast.media.EditTracksInfoRequest(
          requestTrackIds
        );
        await editTracksInfo(request);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
