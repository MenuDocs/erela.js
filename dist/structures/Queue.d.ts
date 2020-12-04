import { Track, UnresolvedTrack } from "./Player";
/**
 * The player's queue, the `current` property is the currently playing track, think of the rest as the up-coming tracks.
 * @noInheritDoc
 */
export declare class Queue extends Array<Track | UnresolvedTrack> {
    /** The total duration of the queue. */
    get duration(): number;
    /** The total size of tracks in the queue including the current track. */
    get totalSize(): number;
    /** The size of tracks in the queue. */
    get size(): number;
    /** The current track */
    current: Track | UnresolvedTrack | null;
    /** The previous track */
    previous: Track | UnresolvedTrack | null;
    /**
     * Adds a track to the queue.
     * @param track
     * @param [offset=null]
     */
    add(track: (Track | UnresolvedTrack) | (Track | UnresolvedTrack)[], offset?: number): void;
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
    remove(start: number, end: number): (Track | UnresolvedTrack)[];
    /** Clears the queue. */
    clear(): void;
    /** Shuffles the queue. */
    shuffle(): void;
}
