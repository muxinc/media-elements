import { parseURI, URITypeMap } from '@spotify-internal/uri';
import {
  EMBED_REQUIRED_IFRAME_ATTRIBUTES,
  EMBED_DEFAULT_HEIGHT,
} from '../../src/utils/constants';
import { IframeAPIEvent, IframeCommands } from './types';

type EventHandler = (eventObject: {
  data: Record<string, string | number | boolean | null>;
}) => void;

type EmbedTheme = 'colorExtraction' | 'dark';

type EmbedIframeOptions = {
  width?: string;
  height?: string;
  uri?: string;
  startAt?: string;
  preferVideo?: boolean;
  theme?: EmbedTheme;
};

type IframeCommandMessage = {
  command: IframeCommands;
  [key: string]: string | number;
};

type PlaybackState = {
  isPaused: boolean;
  isBuffering: boolean;
  duration: number | null;
  positionAsOfTimestamp: number | null;
};

// eslint-disable-next-line prefer-const
let SpotifyIframeApi: SpotifyIframeApiType;

class SpotifyEmbedController {
  private _listeners: Record<IframeAPIEvent, Array<EventHandler>> = {
    [IframeAPIEvent.READY]: [],
    [IframeAPIEvent.PLAYBACK_UPDATE]: [],
  };
  private iframeElement: HTMLIFrameElement;
  private host: string;
  private options: EmbedIframeOptions;
  private currentUri: string = '';
  private loading: boolean = false;
  private _commandQ: IframeCommandMessage[] = [];

  constructor(targetElement: HTMLElement, options: EmbedIframeOptions) {
    // eslint-disable-next-line local-rules/ssr-friendly/no-dom-globals-in-constructor
    this.host = window.SpotifyIframeConfig?.host;
    this.options = options;

    // Make sure that the host has not been overridden to point to a
    // spurious domain
    const url = new URL(this.host);
    if (
      !url.hostname.endsWith('.spotify.com') &&
      !url.hostname.endsWith('.spotify.net')
    ) {
      throw new Error(`It appears that the hostname for the Spotify embed player has been overridden.
      Please make sure that "SpotifyEmbedConfig" is not being overridden.`);
    }

    // eslint-disable-next-line local-rules/ssr-friendly/no-dom-globals-in-constructor
    const iframeElement = document.createElement('iframe');

    Object.entries(EMBED_REQUIRED_IFRAME_ATTRIBUTES).forEach(([attr, val]) => {
      const htmlAttr = attr.toLowerCase();
      if (typeof val === 'boolean') {
        iframeElement.setAttribute(htmlAttr, '');
      } else {
        iframeElement.setAttribute(htmlAttr, val);
      }
    });

    this.iframeElement = iframeElement;

    const width = options.width ?? '100%';
    const height = options.height ?? EMBED_DEFAULT_HEIGHT.toString();
    this.setIframeDimensions(width, height);

    targetElement.parentElement?.replaceChild(iframeElement, targetElement);

    // eslint-disable-next-line local-rules/ssr-friendly/no-dom-globals-in-constructor
    window.addEventListener('message', this.onWindowMessages);
  }

  setIframeDimensions = (width: string, height: string): void => {
    // TODO: Should we check for min (max?) dimensions?
    this.iframeElement.setAttribute('width', width);
    this.iframeElement.setAttribute('height', height);
  };

  onWindowMessages = (e: MessageEvent): void => {
    if (e.source === this.iframeElement.contentWindow) {
      if (e.data?.type === IframeAPIEvent.READY) {
        this.onPlayerReady();
      }

      if (e.data?.type === IframeAPIEvent.PLAYBACK_UPDATE) {
        const playbackState = e.data?.payload;
        this.onPlaybackUpdate(playbackState);
      }
    }
  };

  addListener = (
    eventName: IframeAPIEvent,
    handler: EventHandler,
  ): VoidFunction => {
    if (!this._listeners[eventName]) {
      this._listeners[eventName] = [];
    }

    this._listeners[eventName].push(handler);
    return (): void => {
      this.removeListener(eventName, handler);
    };
  };

  removeListener = (eventName: IframeAPIEvent, handler: EventHandler): void => {
    if (!this._listeners[eventName] || !this._listeners[eventName].length) {
      this._listeners[eventName] = this._listeners[eventName].filter(
        storedHandler => handler !== storedHandler,
      );
    }
  };

  emitEvent = (
    eventName: IframeAPIEvent,
    eventData: Record<string, string | number | boolean | null>,
  ): void => {
    this._listeners[eventName]?.forEach(handler =>
      handler({ data: eventData }),
    );
  };

  onPlayerReady = (): void => {
    this.loading = false;
    this.flushCommandQ();
    this.playerReadyAck();
    this.emitEvent(IframeAPIEvent.READY, {});
  };

  onPlaybackUpdate = (playbackState: PlaybackState): void => {
    this.emitEvent(IframeAPIEvent.PLAYBACK_UPDATE, playbackState);
  };

  loadUri = (uriString: string, preferVideo: boolean = false): void => {
    if (uriString !== this.currentUri) {
      const uri = parseURI(uriString);
      if (
        uri &&
        (uri.type === URITypeMap.EPISODE ||
          uri.type === URITypeMap.SHOW ||
          uri.type === URITypeMap.ALBUM ||
          uri.type === URITypeMap.ARTIST ||
          uri.type === URITypeMap.PLAYLIST_V2 ||
          uri.type === URITypeMap.TRACK)
      ) {
        this.loading = true;
        const type =
          uri.type === URITypeMap.PLAYLIST_V2 ? 'playlist' : uri.type;
        const embedURL = new URL(`${this.host}/embed/${type}/${uri.id}`);

        if (this.options.startAt) {
          const startAt = parseInt(this.options.startAt, 10);
          if (!isNaN(startAt))
            embedURL.searchParams.append('t', startAt.toString());
        }

        if (this.options.theme === 'dark') {
          embedURL.searchParams.append('theme', '0');
        }

        this.iframeElement.src = embedURL.href;

        if (
          (uri.type === URITypeMap.EPISODE || uri.type === URITypeMap.SHOW) &&
          preferVideo
        ) {
          SpotifyIframeApi.supportsVideo(uriString).then(isVideoContent => {
            if (isVideoContent) {
              embedURL.pathname += '/video';
              this.iframeElement.src = embedURL.href;
            }
          });
        }
      } else {
        throw new Error(`${uriString} cannot be embedded.`);
      }
    }
  };

  // We use this message to instrument the loading of content using the iframe API
  playerReadyAck = (): void => {
    this.sendMessageToEmbed({ command: IframeCommands.LOAD_COMPLETE_ACK });
  };

  play = (): void => {
    this.sendMessageToEmbed({ command: IframeCommands.PLAY });
  };

  playFromStart = (): void => {
    this.sendMessageToEmbed({ command: IframeCommands.PLAY_FROM_START });
  };

  pause = (): void => {
    this.sendMessageToEmbed({ command: IframeCommands.PAUSE });
  };

  resume = (): void => {
    this.sendMessageToEmbed({ command: IframeCommands.RESUME });
  };

  togglePlay = (): void => {
    this.sendMessageToEmbed({ command: IframeCommands.TOGGLE_PLAY });
  };

  seek = (timestampInSeconds: number): void => {
    this.sendMessageToEmbed({
      command: IframeCommands.SEEK,
      timestamp: timestampInSeconds,
    });
  };

  sendMessageToEmbed = (messageToSend: IframeCommandMessage): void => {
    if (this.loading) {
      this._commandQ.push(messageToSend);
      return;
    }

    if (this.iframeElement.contentWindow) {
      this.iframeElement.contentWindow.postMessage(messageToSend, this.host);
    } else {
      // eslint-disable-next-line no-console
      console.error(`Spotify Embed: Failed to send message ${messageToSend}.
      Most likely this is because the iframe containing the embed player
      has not finished loading yet.`);
    }
  };

  flushCommandQ = (): void => {
    if (this._commandQ.length) {
      this._commandQ.forEach(command => {
        setTimeout(() => {
          this.sendMessageToEmbed(command);
        }, 0);
      });

      this._commandQ = [];
    }
  };

  destroy = (): void => {
    this.iframeElement.parentElement?.removeChild(this.iframeElement);
    window.removeEventListener('message', this.onWindowMessages);
  };
}

SpotifyIframeApi = {
  createController: (targetElement, options = {}, callback): void => {
    const apiInstance = new SpotifyEmbedController(targetElement, options);
    if (options.uri) {
      apiInstance.loadUri(options.uri, options.preferVideo);
    }
    callback(apiInstance);
  },
  supportsVideo: async (uri: string): Promise<boolean> => {
    const host = window.SpotifyIframeConfig?.host;
    const response = await fetch(
      `${host}/oembed?url=${encodeURIComponent(uri)}`,
      {
        method: 'GET',
      },
    );

    const data = await response.json();
    return data.type === 'video';
  },
};

export default SpotifyIframeApi;

// eslint-disable-next-line local-rules/ssr-friendly/no-dom-globals-in-module-scope
if (!window.onSpotifyIframeApiReady) {
  // eslint-disable-next-line no-console
  console.warn(`SpotifyIframeApi: "onSpotifyIframeApiReady" has not been defined.
  Please read the docs to see why you are seeing this warning.`);
} else {
  window.onSpotifyIframeApiReady(SpotifyIframeApi);
}
