import { Track } from "./Player";
import { TrackUtils } from "./Utils";

/** @noInheritDoc */
export class Queue extends Array<Track> {
  /** The total duration of the queue. */
  public get duration(): number {
    const current = (this.current || {}).duration || 0;
    return this.map((track: Track) => track.duration).reduce(
      (acc: number, cur: number) => acc + cur,
      current
    );
  }

  /** The total size of tracks in the queue. */
  public get size(): number {
    return this.length + (this.current ? 1 : 0)
  }

  /** The current track */
  public current: Track | null = null

  /**
   * Adds a track to the queue.
   * @param track
   * @param [offset=null]
   */
  public add(track: Track | Track[], offset?: number): void {
    if (!TrackUtils.validate(track)) {
      throw new RangeError('Queue#add() Track must be a "Track" or "Track[]".');
    }

    if (!this.current) {
      if (!Array.isArray(track)) {
        this.current = track;
        return;
      } else {
        this.current = (track = [...track]).shift();
      }
    }

    if (typeof offset !== "undefined" && typeof offset === "number") {
      if (isNaN(offset)) {
        throw new RangeError("Queue#add() Offset must be a number.");
      }

      if (offset < 0 || offset > this.length) {
        throw new RangeError(
          `Queue#add() Offset must be or between 0 and ${this.length}.`
        );
      }
    }

    if (typeof offset === "undefined" && typeof offset !== "number") {
      if (track instanceof Array) this.push(...track);
      else this.push(track);
    } else {
      if (track instanceof Array) this.splice(offset, 0, ...track);
      else this.splice(offset, 0, track);
    }
  }

  /**
   * Removes a track from the queue. Defaults to the first track, returning the removed track.
   * @param [position=0]
   */
  public remove(position?: number): Track[]

  /**
   * Removes an amount of tracks using a start and end index, returning the removed tracks.
   * @param start
   * @param end
   */
  public remove(start: number, end: number): Track[]
  public remove(startOrPosition = 0, end?: number): Track[] {
    if (typeof end !== "undefined") {
      if (isNaN(startOrPosition)) {
        throw new RangeError(`Queue#remove() Missing "start" parameter.`);
      } else if (isNaN(end)) {
        throw new RangeError(`Queue#remove() Missing "end" parameter.`);
      } else if (startOrPosition >= end) {
        throw new RangeError(
          "Queue#remove() Start can not be bigger than end."
        );
      } else if (startOrPosition >= this.length) {
        throw new RangeError(
          `Queue#remove() Start can not be bigger than ${this.length}.`
        );
      }

      return this.splice(startOrPosition, end - startOrPosition);
    }

    return this.splice(startOrPosition, 1);
  }

  /** Clears the queue. */
  public clear(): void {
    this.splice(0);
  }

  /** Shuffles the queue. */
  public shuffle(): void {
    for (let i = this.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this[i], this[j]] = [this[j], this[i]];
    }
  }
}
