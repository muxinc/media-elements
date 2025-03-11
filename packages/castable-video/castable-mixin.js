/* global chrome */
import { RemotePlayback } from './castable-remote-playback.js';
import {
  privateProps,
  requiresCastFramework,
  loadCastFramework,
  currentSession,
  getDefaultCastOptions,
  isHls,
  getPlaylistSegmentFormat
} from './castable-utils.js';

/**
 * CastableMediaMixin
 *
 * This mixin function provides a way to compose multiple classes.
 * @see https://justinfagnani.com/2015/12/21/real-mixins-with-javascript-classes/
 *
 * @param  {HTMLMediaElement} superclass - HTMLMediaElement or an extended class of it.
 * @return {CastableMedia}
 */
export const CastableMediaMixin = (superclass) =>
  class CastableMedia extends superclass {

    static observedAttributes = [
      ...(superclass.observedAttributes ?? []),
      'cast-src',
      'cast-content-type',
      'cast-stream-type',
      'cast-receiver',
    ];

    #localState = { paused: false };
    #castOptions = getDefaultCastOptions();
    #castCustomData;
    #remote;

    get remote() {
      if (this.#remote) return this.#remote;

      if (requiresCastFramework()) {
        // No need to load the Cast framework if it's disabled.
        if (!this.disableRemotePlayback) {
          loadCastFramework();
        }

        privateProps.set(this, {
          loadOnPrompt: () => this.#loadOnPrompt()
        });

        return (this.#remote = new RemotePlayback(this));
      }

      return super.remote;
    }

    get #castPlayer() {
      return privateProps.get(this.remote)?.getCastPlayer?.();
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
      super.attributeChangedCallback(attrName, oldValue, newValue);

      if (attrName === 'cast-receiver' && newValue) {
        this.#castOptions.receiverApplicationId = newValue;
        return;
      }

      if (!this.#castPlayer) return;

      switch (attrName) {
        case 'cast-stream-type':
        case 'cast-src':
          this.load();
          break;
      }
    }

    async #loadOnPrompt() {
      // Pause locally when the session is created.
      this.#localState.paused = super.paused;
      super.pause();

      // Sync over the muted state but not volume, 100% is different on TV's :P
      this.muted = super.muted;

      try {
        await this.load();
      } catch (err) {
        console.error(err);
      }
    }

    async load() {
      if (!this.#castPlayer) return super.load();

      const mediaInfo = new chrome.cast.media.MediaInfo(this.castSrc, this.castContentType);
      mediaInfo.customData = this.castCustomData;

      // Manually add text tracks with a `src` attribute.
      // M3U8's load text tracks in the receiver, handle these in the media loaded event.
      const subtitles = [...this.querySelectorAll('track')].filter(
        ({ kind, src }) => src && (kind === 'subtitles' || kind === 'captions')
      );

      const activeTrackIds = [];
      let textTrackIdCount = 0;

      if (subtitles.length) {
        mediaInfo.tracks = subtitles.map((trackEl) => {
          const trackId = ++textTrackIdCount;
          // only activate 1 subtitle text track.
          if (activeTrackIds.length === 0 && trackEl.track.mode === 'showing') {
            activeTrackIds.push(trackId);
          }

          const track = new chrome.cast.media.Track(
            trackId,
            chrome.cast.media.TrackType.TEXT
          );
          track.trackContentId = trackEl.src;
          track.trackContentType = 'text/vtt';
          track.subtype =
            trackEl.kind === 'captions'
              ? chrome.cast.media.TextTrackType.CAPTIONS
              : chrome.cast.media.TextTrackType.SUBTITLES;
          track.name = trackEl.label;
          track.language = trackEl.srclang;
          return track;
        });
      }

      if (this.castStreamType === 'live') {
        mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;
      } else {
        mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;
      }

      mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = this.title;
      mediaInfo.metadata.images = [{ url: this.poster }];

      if (isHls(this.castSrc)) {
        const segmentFormat = await getPlaylistSegmentFormat(this.castSrc);
        const isFragmentedMP4 = segmentFormat?.includes('m4s') || segmentFormat?.includes('mp4');
        if (isFragmentedMP4) {
          mediaInfo.hlsSegmentFormat = chrome.cast.media.HlsSegmentFormat.FMP4;
          mediaInfo.hlsVideoSegmentFormat = chrome.cast.media.HlsVideoSegmentFormat.FMP4;
        }
      }

      const request = new chrome.cast.media.LoadRequest(mediaInfo);
      request.currentTime = super.currentTime ?? 0;
      request.autoplay = !this.#localState.paused;
      request.activeTrackIds = activeTrackIds;

      await currentSession()?.loadMedia(request);

      this.dispatchEvent(new Event('volumechange'));
    }

    play() {
      if (this.#castPlayer) {
        if (this.#castPlayer.isPaused) {
          this.#castPlayer.controller?.playOrPause();
        }
        return;
      }
      return super.play();
    }

    pause() {
      if (this.#castPlayer) {
        if (!this.#castPlayer.isPaused) {
          this.#castPlayer.controller?.playOrPause();
        }
        return;
      }
      super.pause();
    }

    /**
     * @see https://developers.google.com/cast/docs/reference/web_sender/cast.framework.CastOptions
     * @readonly
     *
     * @typedef {Object} CastOptions
     * @property {string} [receiverApplicationId='CC1AD845'] - The app id of the cast receiver.
     * @property {string} [autoJoinPolicy='origin_scoped'] - The auto join policy.
     * @property {string} [language='en-US'] - The language to use for the cast receiver.
     * @property {boolean} [androidReceiverCompatible=false] - Whether to use the Cast Connect.
     * @property {boolean} [resumeSavedSession=true] - Whether to resume the last session.
     *
     * @return {CastOptions}
     */
    get castOptions() {
      return this.#castOptions;
    }

    get castReceiver() {
      return this.getAttribute('cast-receiver') ?? undefined;
    }

    set castReceiver(val) {
      if (this.castReceiver == val) return;
      this.setAttribute('cast-receiver', `${val}`);
    }

    // Allow the cast source url to be different than <video src>, could be a blob.
    get castSrc() {
      // Try the first <source src> for usage with even more native markup.
      return (
        this.getAttribute('cast-src') ??
        this.querySelector('source')?.src ??
        this.currentSrc
      );
    }

    set castSrc(val) {
      if (this.castSrc == val) return;
      this.setAttribute('cast-src', `${val}`);
    }

    get castContentType() {
      return this.getAttribute('cast-content-type') ?? undefined;
    }

    set castContentType(val) {
      this.setAttribute('cast-content-type', `${val}`);
    }

    get castStreamType() {
      // NOTE: Per https://github.com/video-dev/media-ui-extensions/issues/3 `streamType` may yield `"unknown"`
      return this.getAttribute('cast-stream-type') ?? this.streamType ?? undefined;
    }

    set castStreamType(val) {
      this.setAttribute('cast-stream-type', `${val}`);
    }

    get castCustomData() {
      return this.#castCustomData;
    }

    set castCustomData(val) {
      const valType = typeof val;
      if (!['object', 'undefined'].includes(valType)) {
        console.error(`castCustomData must be nullish or an object but value was of type ${valType}`);
        return;
      }

      this.#castCustomData = val;
    }

    get readyState() {
      if (this.#castPlayer) {
        switch (this.#castPlayer.playerState) {
          case chrome.cast.media.PlayerState.IDLE:
            return 0;
          case chrome.cast.media.PlayerState.BUFFERING:
            return 2;
          default:
            return 3;
        }
      }
      return super.readyState;
    }

    get paused() {
      if (this.#castPlayer) return this.#castPlayer.isPaused;
      return super.paused;
    }

    get muted() {
      if (this.#castPlayer) return this.#castPlayer?.isMuted;
      return super.muted;
    }

    set muted(val) {
      if (this.#castPlayer) {
        if (
          (val && !this.#castPlayer.isMuted) ||
          (!val && this.#castPlayer.isMuted)
        ) {
          this.#castPlayer.controller?.muteOrUnmute();
        }
        return;
      }
      super.muted = val;
    }

    get volume() {
      if (this.#castPlayer) return this.#castPlayer?.volumeLevel ?? 1;
      return super.volume;
    }

    set volume(val) {
      if (this.#castPlayer) {
        this.#castPlayer.volumeLevel = +val;
        this.#castPlayer.controller?.setVolumeLevel();
        return;
      }
      super.volume = val;
    }

    get duration() {
      // castPlayer duration returns `0` when no media is loaded.
      if (this.#castPlayer && this.#castPlayer?.isMediaLoaded) {
        return this.#castPlayer?.duration ?? NaN;
      }
      return super.duration;
    }

    get currentTime() {
      if (this.#castPlayer && this.#castPlayer?.isMediaLoaded) {
        return this.#castPlayer?.currentTime ?? 0;
      }
      return super.currentTime;
    }

    set currentTime(val) {
      if (this.#castPlayer) {
        this.#castPlayer.currentTime = val;
        this.#castPlayer.controller?.seek();
        return;
      }
      super.currentTime = val;
    }
  };

export const CastableVideoMixin = CastableMediaMixin;
