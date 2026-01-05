type Constructor<T = {}> = new (...args: any[]) => T;

type TimeRange = { start: number; end: number };

export function MediaPlayedRangesMixin<T extends Constructor>(Base: T): T & {
  new (...args: any[]): {
    addPlayedRange(start: number, end: number): void;
    readonly played: TimeRanges;
  };
};
