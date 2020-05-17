import { Structure, mix } from "./Utils";
import { Track } from "./Player";

const template = [
    "track", "title", "identifer", "author", "length",
    "isSeekable", "isStream", "uri", "thumbnail", "user",
];

export interface Queue extends Structure, Array<Track> {}
/** The Queue class. */
export class Queue {
    /**
     * Adds a track to the queue.
     * @param {(Track|Track[])} track The track or tracks to add.
     * @param {number} [offset=0] The offset to add the track at.
     */
    public add(track: Track | Track[], offset: number = null): void {
        if (!(Array.isArray(track) || !template.every((v) => Object.keys(track).includes(v)))) {
            throw new RangeError("Queue#add(track: Track|Track[]) Track must be a \"Track\" or \"Track[]\".");
        }

        if (offset !== null) {
            if (isNaN(offset)) {
                throw new RangeError("Queue#add(track: Track|Track[], offset: number) Offset must be a number.");
            }

            if (offset < 0 || offset > this.length) {
                throw new RangeError(`Queue#add(track: Track|Track[], offset: number) Offset must be or between 0 and ${this.length}.`);
            }
        }

        if (offset === null) {
            if (track instanceof Array) this.push(...track); else this.push(track);
        } else {
            if (track instanceof Array)  this.splice(offset, 0, ...track); else this.splice(offset, 0, track);
        }
    }
}

mix(Queue, Array, Structure);
