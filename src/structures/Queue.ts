import { Track } from "./Player";

const template = [
    "track",
    "title",
    "identifer",
    "author",
    "length",
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
    /**
     * Adds a track to the queue.
     * @param {(Track|Track[])} track The track or tracks to add.
     * @param {number} [offset=0] The offset to add the track at.
     */
    public add(track: Track | Track[], offset: number = null): void {
        if (!(Array.isArray(track) || !template.every((v) => Object.keys(track).includes(v)))) {
            throw new RangeError("Queue#add() Track must be a \"Track\" or \"Track[]\".");
        }

        if (offset !== null) {
            if (isNaN(offset)) {
                throw new RangeError("Queue#add() Offset must be a number.");
            }

            if (offset < 0 || offset > this.length) {
                throw new RangeError(`Queue#add() Offset must be or between 0 and ${this.length}.`);
            }
        }

        if (offset === null) {
            if (track instanceof Array) this.push(...track); else this.push(track);
        } else {
            if (track instanceof Array)  this.splice(offset, 0, ...track); else this.splice(offset, 0, track);
        }
    }

    /**
     * Removes an amount of tracks using a start and end index.
     * @param {number} start The start to remove from.
     * @param {number} end The end to remove to.
     */
    public removeFrom(start: number, end: number): Track[] {
        if (typeof start === "undefined") {
            throw new RangeError(`Queue#removeFrom() Missing "start" parameter.`);
        } else if (typeof end === "undefined") {
            throw new RangeError(`Queue#removeFrom() Missing "end" parameter.`);
        } else if (start >= end) {
            throw new RangeError(`Queue#removeFrom() Start can not be bigger than end.`);
        } else if (start >= this.length) {
            throw new RangeError(`Queue#removeFrom() Start can not be bigger than ${this.length}.`);
        }

        return this.splice(start, end);
    }

    /**
     * Removes a track to the queue. Defaults to the first track.
     * @param {(Track|number)} [track=0] The track to remove.
     * @returns {(Track|null)} The track that was removed, or null if the track does not exist.
     */
    public remove(track: Track|number = 0): Track | null {
        const position = typeof track === "number" ? track : this.indexOf(track as Track);
        if (position === -1) {
            return null;
        }
        return this.splice(position, 1)[0];
    }

    /** Clears the queue. */
    public clear(): void {
        this.splice(1);
    }

    /** Shuffles the queue. */
    public shuffle(): void {
        const track = this.shift();
        for (let i = this.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this[i], this[j]] = [this[j], this[i]];
        }
        this.unshift(track);
    }
}
