import { Track } from "./Track";
import { ErelaClient } from "../ErelaClient";

/**
 * The Queue class.
 * @noInheritDoc
 */
export class Queue extends Array {
    /**
     * Returns the total duration of the queue.
     * @returns {number} - The duration of the queue.
     */
    public get duration(): number {
        return this.map((track: Track) => track.duration).reduce((acc: number, cur: number) => acc + cur, 0);
    }

    /**
     * Returns the size of the queue.
     * @returns {number} - The size of the queue.
     */
    public get size(): number {
        return this.length;
    }

    /**
     * Returns if the queue is empty or not.
     * @returns {boolean} - If the queue is empty or not.
     */
    get empty(): boolean {
        return this.size === 0;
    }

    /**
     * Creates an instance of Queue.
     * @param {ErelaClient} erela - The Erela Client.
     */
    public constructor(public readonly erela: ErelaClient) {
        super();
    }

    /**
     * Adds a track to the queue.
     * @param {(Track|Track[])} track - The track or tracks to add.
     * @param {number} [offset=0] - The offset to add the track at.
     */
    public add(track: Track|Track[], offset: number = 0): void {
        if (!(Array.isArray(track) || track instanceof this.erela.track)) {
            throw new RangeError("Queue#add(track: Track|Track[]) Track must be a \"Track\" or \"Track[]\".");
        }

        if (isNaN(offset)) {
            throw new RangeError("Queue#add(track: Track|Track[], offset: number) Offset must be a number.");
        }

        if (offset < 0 || offset > this.size) {
            // tslint:disable-next-line: max-line-length
            throw new RangeError(`Queue#add(track: Track|Track[], offset: number) Offset must be or between 0 and ${this.size}.`);
        }

        if (offset === 0) {
            this.push(track);
        } else {
            this.splice(offset, 0, track);
        }
    }

    /**
     * Removes a track to the queue. Defaults to the first track.
     * @param {(Track|number)} [track=0] - The track to remove.
     * @returns {(Track|null)} - The track that was removed, or null if the track does not exist.
     */
    public removeFrom(start: number, end: number): Track[]|null {
        if (typeof start === "undefined") {
            throw new RangeError(`Queue#removeFrom(start: number, end: number) Missing "start" parameters.`);
        } else if (typeof end === "undefined") {
            throw new RangeError(`Queue#removeFrom(start: number, end: number) Missing "end" parameters.`);
        } else if (start >= end) {
            throw new RangeError(`Queue#removeFrom(start: number, end: number) Start can not be bigger than end.`);
        } else if (start >= this.size) {
            throw new RangeError(`Queue#removeFrom(start: number, end: number) Start can not be bigger than ${this.size}.`);
        }

        return this.splice(start, end);
    }

    /**
     * Removes a track to the queue. Defaults to the first track.
     * @param {(Track|number)} [track=0] - The track to remove.
     * @returns {(Track|null)} - The track that was removed, or null if the track does not exist.
     */
    public remove(track: Track|number = 0): Track|null {
        const position = typeof track === "number" ? track : this.indexOf(track as Track);
        if (position === -1) {
            return null;
        }
        return this.splice(position, 1)[0];
    }

    /**
     * Clears the queue.
     */
    public clear(): void {
        this.splice(0);
    }

    /**
     * Shuffles the queue.
     */
    public shuffle(): void {
        const track = this.shift();
        for (let i = this.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [this[i], this[j]] = [this[j], this[i]];
        }
        this.unshift(track);
    }
}
