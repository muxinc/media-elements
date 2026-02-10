export interface PlayedRange {
  start: number;
  end: number;
}

export interface MediaPlayedRangesMixinHost {
  currentTime: number;
  paused: boolean;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
}

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface PlaybackEventParam {
  time?: number;
}

export function MediaPlayedRangesMixin<
  TBase extends Constructor<MediaPlayedRangesMixinHost>
>(
  Base: TBase
): Constructor<
  InstanceType<TBase> & {
    /** Internal merged played ranges */
    _playedRanges: PlayedRange[];

    /** Currently accumulating range */
    _currentPlayedRange: PlayedRange | null;

    /** Merge tolerance (seconds) */
    _RANGE_EPSILON: number;

    /** Whether the media is currently seeking */
    _seeking: boolean;

    addPlayedRange(start: number, end: number): void;

    /** TimeRanges-like representation of played media */
    readonly played: TimeRanges;
  }
>;
