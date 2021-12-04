import { Manager, SearchQuery, SearchResult } from "./Manager";
import { Node } from "./Node";
import { Queue } from "./Queue";
import { Sizes, State, VoiceState } from "./Utils";
export declare class Player {
    options: PlayerOptions;
    /** The Queue for the Player. */
    readonly queue: Queue;
    /** Whether the queue repeats the track. */
    trackRepeat: boolean;
    /** Whether the queue repeats the queue. */
    queueRepeat: boolean;
    /** The time the player is in the track. */
    position: number;
    /** Whether the player is playing. */
    playing: boolean;
    /** Whether the player is paused. */
    paused: boolean;
    /** The volume for the player */
    volume: number;
    /** The Node for the Player. */
    node: Node;
    /** The guild for the player. */
    guild: string;
    /** The voice channel for the player. */
    voiceChannel: string | null;
    /** The text channel for the player. */
    textChannel: string | null;
    /** The current state of the player. */
    state: State;
    /** The equalizer bands array. */
    bands: number[];
    /** The voice state object from Discord. */
    voiceState: VoiceState;
    /** The Manager. */
    manager: Manager;
    private static _manager;
    private readonly data;
    /**
     * Set custom data.
     * @param key
     * @param value
     */
    set(key: string, value: unknown): void;
    /**
     * Get custom data.
     * @param key
     */
    get<T>(key: string): T;
    /** @hidden */
    static init(manager: Manager): void;
    /**
     * Creates a new player, returns one if it already exists.
     * @param options
     */
    constructor(options: PlayerOptions);
    /**
     * Same as Manager#search() but a shortcut on the player itself.
     * @param query
     * @param requester
     */
    search(query: string | SearchQuery, requester?: unknown): Promise<SearchResult>;
    /**
     * Sets the players equalizer band on-top of the existing ones.
     * @param bands
     */
    setEQ(...bands: EqualizerBand[]): this;
    /** Clears the equalizer bands. */
    clearEQ(): this;
    /** Connect to the voice channel. */
    connect(): this;
    /** Disconnect from the voice channel. */
    disconnect(): this;
    /** Destroys the player. */
    destroy(disconnect?: boolean): void;
    /**
     * Sets the player voice channel.
     * @param channel
     */
    setVoiceChannel(channel: string): this;
    /**
     * Sets the player text channel.
     * @param channel
     */
    setTextChannel(channel: string): this;
    /** Plays the next track. */
    play(): Promise<void>;
    /**
     * Plays the specified track.
     * @param track
     */
    play(track: Track | UnresolvedTrack): Promise<void>;
    /**
     * Plays the next track with some options.
     * @param options
     */
    play(options: PlayOptions): Promise<void>;
    /**
     * Plays the specified track with some options.
     * @param track
     * @param options
     */
    play(track: Track | UnresolvedTrack, options: PlayOptions): Promise<void>;
    /**
     * Sets the player volume.
     * @param volume
     */
    setVolume(volume: number): this;
    /**
     * Sets the track repeat.
     * @param repeat
     */
    setTrackRepeat(repeat: boolean): this;
    /**
     * Sets the queue repeat.
     * @param repeat
     */
    setQueueRepeat(repeat: boolean): this;
    /** Stops the current track, optionally give an amount to skip to, e.g 5 would play the 5th song. */
    stop(amount?: number): this;
    /**
     * Pauses the current track.
     * @param pause
     */
    pause(pause: boolean): this;
    /**
     * Seeks to the position in the current track.
     * @param position
     */
    seek(position: number): this;
}
export interface PlayerOptions {
    /** The guild the Player belongs to. */
    guild: string;
    /** The text channel the Player belongs to. */
    textChannel: string;
    /** The voice channel the Player belongs to. */
    voiceChannel?: string;
    /** The node the Player uses. */
    node?: string;
    /** The initial volume the Player will use. */
    volume?: number;
    /** If the player should mute itself. */
    selfMute?: boolean;
    /** If the player should deaf itself. */
    selfDeafen?: boolean;
}
/** If track partials are set some of these will be `undefined` as they were removed. */
export interface Track {
    /** The base64 encoded track. */
    readonly track: string;
    /** The title of the track. */
    readonly title: string;
    /** The identifier of the track. */
    readonly identifier: string;
    /** The author of the track. */
    readonly author: string;
    /** The duration of the track. */
    readonly duration: number;
    /** If the track is seekable. */
    readonly isSeekable: boolean;
    /** If the track is a stream.. */
    readonly isStream: boolean;
    /** The uri of the track. */
    readonly uri: string;
    /** The thumbnail of the track or null if it's a unsupported source. */
    readonly thumbnail: string | null;
    /** The user that requested the track. */
    readonly requester: unknown | null;
    /** Displays the track thumbnail with optional size or null if it's a unsupported source. */
    displayThumbnail(size?: Sizes): string;
}
/** Unresolved tracks can't be played normally, they will resolve before playing into a Track. */
export interface UnresolvedTrack extends Partial<Track> {
    /** The title to search against. */
    title: string;
    /** The author to search against. */
    author?: string;
    /** The duration to search within 1500 milliseconds of the results from YouTube. */
    duration?: number;
    /** Resolves into a Track. */
    resolve(): Promise<void>;
}
export interface PlayOptions {
    /** The position to start the track. */
    readonly startTime?: number;
    /** The position to end the track. */
    readonly endTime?: number;
    /** Whether to not replace the track if a play payload is sent. */
    readonly noReplace?: boolean;
}
export interface EqualizerBand {
    /** The band number being 0 to 14. */
    band: number;
    /** The gain amount being -0.25 to 1.00, 0.25 being double. */
    gain: number;
}
