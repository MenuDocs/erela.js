import { Track } from "./Player";

const template = [
  "track",
  "title",
  "identifier",
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

  /** Returns the amount of tracks in the queue including the current if it exists. */
  public get length(): number {
    return super.length + (this.current ? 1 : 0)
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
   * Removes a track from the queue. Defaults to the first track.
   * @param [position=0] The track index to remove.
   * @returns The track that was removed, or null if the track does not exist.
   */
  public remove(position: number): Track[] | null
  /**
   * Removes an amount of tracks using a start and end index.
   * @param start The start to remove from.
   * @param end The end to remove to.
   */
  public remove(start: number, end: number): Track[] | null
  public remove(startOrPosition = 0, end?: number): Track[] | null {
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
