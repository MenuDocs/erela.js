import { Track } from "./Player";
/**
 * The player's queue, the `current` property is the currently playing track, think of the rest as the up-coming tracks.
 * @noInheritDoc
 */
export declare class Queue extends Array<Track> {
    /** The total duration of the queue. */
    get duration(): number;
    /** The total size of tracks in the queue. */
    get size(): number;
    /** The current track */
    current: Track | null;
    /**
     * Adds a track to the queue.
     * @param track
     * @param [offset=null]
     */
    add(track: Track | Track[], offset?: number): void;
    /**
     * Removes a track from the queue. Defaults to the first track, returning the removed track, EXCLUDING THE `current` TRACK.
     * @param [position=0]
     */
    remove(position?: number): Track[];
    /**
     * Removes an amount of tracks using a exclusive start and end exclusive index, returning the removed tracks, EXCLUDING THE `current` TRACK.
     * @param start
     * @param end
     */
    remove(start: number, end: number): Track[];
    /** Clears the queue. */
    clear(): void;
    /** Shuffles the queue. */
    shuffle(): void;
}
