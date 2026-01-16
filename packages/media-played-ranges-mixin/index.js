export function MediaPlayedRangesMixin(Base) {
  return class MediaPlayedRanges extends Base {
    _playedRanges = [];
    _currentPlayedRange = null;
    _RANGE_EPSILON = 0.5;
    _seeking = false;

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.addEventListener('play', () => this.onPlaybackStart({ time: this.currentTime }));
      this.addEventListener('pause', () => this.onPlaybackStop({ time: this.currentTime }));
      this.addEventListener('ended', () => this.onPlaybackStop({ time: this.currentTime }));
      this.addEventListener('seeking', () => this.onSeeking());
      this.addEventListener('seeked', () => this.onSeeked({ time: this.currentTime }));
    }

    onPlaybackStart(param = {}) {
      this._seeking = false;
      const { time } = param;
      const t = typeof time === 'number' ? time : this.currentTime;

      if (!this._currentPlayedRange) {
        this._currentPlayedRange = { start: t, end: t };
      }
    }

    onSeeking() {
      this._seeking = true;
      this._commitCurrentRange();
    }

    onSeeked(param = {}) {
      this._seeking = false;
      const { time } = param;
      const t = typeof time === 'number' ? time : this.currentTime;
      this._currentPlayedRange = { start: t, end: t };
    }

    onPlaybackStop(param = {}) {
      const { time } = param;
      const t = typeof time === 'number' ? time : this.currentTime;
      this._commitCurrentRange(t);
    }

    _commitCurrentRange(time) {
      if (!this._currentPlayedRange) return;

      if (typeof time === 'number') {
        this._currentPlayedRange.end = time;
      }

      const { start, end } = this._currentPlayedRange;
      this._currentPlayedRange = null;
      this.addPlayedRange(start, end);
    }

    addPlayedRange(start, end) {
      if (start >= end) return;

      const EPS = this._RANGE_EPSILON;
      const allRanges = [...this._playedRanges, { start, end }];

      allRanges.sort((a, b) => a.start - b.start);

      const merged = [];
      for (const range of allRanges) {
        if (!merged.length) {
          merged.push({ ...range });
          continue;
        }

        const last = merged[merged.length - 1];

        if (range.start <= last.end + EPS) {
          last.start = Math.min(last.start, range.start);
          last.end = Math.max(last.end, range.end);
        } else {
          merged.push({ ...range });
        }
      }

      this._playedRanges = merged;
    }

    get played() {
      const time = this.currentTime;

      if (!this.paused && !this._currentPlayedRange && typeof time === 'number') {
        this._currentPlayedRange = { start: time, end: time };
      }

      if (this._currentPlayedRange && typeof time === 'number') {
        if (time > this._currentPlayedRange.end) {
          this._currentPlayedRange.end = time;
        }
        this.addPlayedRange(this._currentPlayedRange.start, this._currentPlayedRange.end);
      }

      if (!this._playedRanges.length) {
        return createTimeRangesObj([[0, 0]]);
      }

      return createTimeRangesObj(this._playedRanges.map((r) => [r.start, r.end]));
    }
  };
}

function createTimeRangesObj(ranges) {
  Object.defineProperties(ranges, {
    start: { value: (i) => ranges[i][0] },
    end: { value: (i) => ranges[i][1] },
  });
  return ranges;
}
