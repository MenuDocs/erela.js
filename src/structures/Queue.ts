import { Player, Track } from "./Player";

const template = [
  "track",
  "title",
  "identifer",
  "author",
  "duration",
  "isSeekable",
  "isStream",
  "uri",
  "thumbnail",
  "user",
];

/**
 * The Queue class.
 * @noInheritDoc
 */
export class Queue extends Array<Track> {
  /** Returns the total duration of the queue including the current track. */
  public get duration(): number {
    const current = (this.current || {}).duration || 0;
    return this.map((track: Track) => track.duration).reduce(
      (acc: number, cur: number) => acc + cur,
      current
    );
  }

  /** The current track */
  public current: Track = null

  /**
   * Adds a track to the queue.
   * @param track The track or tracks to add.
   * @param [offset=null] The offset to add the track at.
   */
  public add(track: Track | Track[], offset?: number): void {
    if (
      !(
        Array.isArray(track) ||
        !template.every((v) => Object.keys(track).includes(v))
      )
    ) {
      throw new RangeError('Queue#add() Track must be a "Track" or "Track[]".');
    }

    if (!this.current) {
      if (!Array.isArray(track)) {
        this.current = track;
        return;
      } else {
        this.current = track.shift();
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
   * Removes an amount of tracks using a start and end index.
   * @param start The start to remove from.
   * @param end The end to remove to.
   */
  public removeFrom(start: number, end: number): Track[] {
    if (isNaN(start)) {
      throw new RangeError(`Queue#removeFrom() Missing "start" parameter.`);
    } else if (isNaN(end)) {
      throw new RangeError(`Queue#removeFrom() Missing "end" parameter.`);
    } else if (start >= end) {
      throw new RangeError(
        `Queue#removeFrom() Start can not be bigger than end.`
      );
    } else if (start >= this.length) {
      throw new RangeError(
        `Queue#removeFrom() Start can not be bigger than ${this.length}.`
      );
    }

    return this.splice(start, end - start);
  }

  /**
   * Removes a track from the queue. Defaults to the first track.
   * @param [position=0] The track index to remove.
   * @returns The track that was removed, or null if the track does not exist.
   */
  public remove(position = 0): Track | null {
    return this.splice(position, 1)[0];
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
