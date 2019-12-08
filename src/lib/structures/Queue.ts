import { ITrack } from "./Track";
import { ErelaClient } from "../ErelaClient";

/**
 * The Queue interface.
 * @export
 * @interface IQueue
 * @extends {Array<ITrack>}
 * @template ITrack
 */
export interface IQueue extends Array<ITrack> {
    readonly erela: ErelaClient;
    readonly duration: number;
    readonly size: number;
    readonly empty: boolean;
    add(track: ITrack, offset?: number): void;
    remove(track: ITrack|number): ITrack | null;
    clear(): void;
    shuffle(): void;
}

/**
 * The Queue class.
 * @export
 * @class Queue
 * @extends {Array}
 * @implements {IQueue<ITrack>}
 */
export class Queue extends Array implements IQueue {
    public readonly erela: ErelaClient;
    /**
     * Creates an instance of Queue.
     * @memberof Queue
     * @param {ErelaClient} erela - The Erela Client.
     */
    public constructor(erela: ErelaClient) {
        super();
        this.erela = erela;
    }

    /**
     * Adds a track to the queue.
     * @param {ITrack} track - The track to add.
     * @param {number} [offset=0] - The offset to add the track at.
     * @memberof Queue
     */
    public add(track: ITrack, offset: number = 0): void {
        if (!(track instanceof this.erela.track)) {
            throw new RangeError("Queue#add(track: ITrack) Track must be implemented by \"ITrack\" or extended from \"Track\".");
        }

        if (isNaN(offset)) {
            throw new RangeError("Queue#add(track: ITrack, offset: number) Offset must be a number.");
        }

        if (offset < 0 || offset > this.size) {
            throw new RangeError(`Queue#add(track: ITrack, offset: number) Offset must be or between 0 and ${this.size}.`);
        }

        if (offset === 0) {
            this.push(track);
        } else {
            this.splice(offset, 0, track);
        }
    }

    /**
     * Removes a track to the queue. Defaults to the first track.
     * @param {ITrack|number} [track=0] - The track to remove.
     * @return {ITrack|null} - The track that was removed, or null if the track does not exist.
     * @memberof Queue
     */
    public removeFrom(start: number, end: number): ITrack[]|null {
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
     * @param {ITrack|number} [track=0] - The track to remove.
     * @return {ITrack|null} - The track that was removed, or null if the track does not exist.
     * @memberof Queue
     */
    public remove(track: ITrack|number = 0): ITrack|null {
        const position = typeof track === "number" ? track : this.indexOf(track as ITrack);
        if (this.indexOf(position) === -1) {
            return null;
        }
        return this.splice(position, 1)[0];
    }

    /**
     * Returns the total duration of the queue.
     * @return {number} - The duration of the queue.
     * @memberof Queue
     */
    public get duration(): number {
        return this.reduce((a, b) => a.duration + b.duration);
    }

    /**
     * Returns the size of the queue.
     * @return {number} - The size of the queue.
     * @memberof Queue
     */
    public get size(): number {
        return this.length;
    }

    /**
     * Clears the queue.
     * @memberof Queue
     */
    public clear(): void {
        this.splice(0);
    }

    /**
     * Returns if the queue is empty or not.
     * @returns {boolean} - If the queue is empty or not.
     * @memberof Queue
     */
    get empty(): boolean {
        return this.size === 0;
    }

    /**
     * Shuffles the queue.
     * @memberof Queue
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
