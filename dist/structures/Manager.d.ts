/// <reference types="node" />
import Collection from "@discordjs/collection";
import { EventEmitter } from "events";
import { VoiceState } from "..";
import { Node, NodeOptions } from "./Node";
import { Player, PlayerOptions, Track, UnresolvedTrack } from "./Player";
import { LoadType, Plugin, TrackData, TrackEndEvent, TrackExceptionEvent, TrackStartEvent, TrackStuckEvent, VoicePacket, VoiceServer, WebSocketClosedEvent } from "./Utils";
export interface Manager {
    /**
     * Emitted when a Node is created.
     * @event Manager#nodeCreate
     */
    on(event: "nodeCreate", listener: (node: Node) => void): this;
    /**
     * Emitted when a Node is destroyed.
     * @event Manager#nodeDestroy
     */
    on(event: "nodeDestroy", listener: (node: Node) => void): this;
    /**
     * Emitted when a Node connects.
     * @event Manager#nodeConnect
     */
    on(event: "nodeConnect", listener: (node: Node) => void): this;
    /**
     * Emitted when a Node reconnects.
     * @event Manager#nodeReconnect
     */
    on(event: "nodeReconnect", listener: (node: Node) => void): this;
    /**
     * Emitted when a Node disconnects.
     * @event Manager#nodeDisconnect
     */
    on(event: "nodeDisconnect", listener: (node: Node, reason: {
        code?: number;
        reason?: string;
    }) => void): this;
    /**
     * Emitted when a Node has an error.
     * @event Manager#nodeError
     */
    on(event: "nodeError", listener: (node: Node, error: Error) => void): this;
    /**
     * Emitted whenever any Lavalink event is received.
     * @event Manager#nodeRaw
     */
    on(event: "nodeRaw", listener: (payload: unknown) => void): this;
    /**
     * Emitted when a player is created.
     * @event Manager#playerCreate
     */
    on(event: "playerCreate", listener: (player: Player) => void): this;
    /**
     * Emitted when a player is destroyed.
     * @event Manager#playerDestroy
     */
    on(event: "playerDestroy", listener: (player: Player) => void): this;
    /**
     * Emitted when a player queue ends.
     * @event Manager#queueEnd
     */
    on(event: "queueEnd", listener: (player: Player, track: Track | UnresolvedTrack, payload: TrackEndEvent) => void): this;
    /**
     * Emitted when a player is moved to a new voice channel.
     * @event Manager#playerMove
     */
    on(event: "playerMove", listener: (player: Player, initChannel: string, newChannel: string) => void): this;
    /**
     * Emitted when a player is disconnected from it's current voice channel.
     * @event Manager#playerDisconnect
     */
    on(event: "playerDisconnect", listener: (player: Player, oldChannel: string) => void): this;
    /**
     * Emitted when a track starts.
     * @event Manager#trackStart
     */
    on(event: "trackStart", listener: (player: Player, track: Track, payload: TrackStartEvent) => void): this;
    /**
     * Emitted when a track ends.
     * @event Manager#trackEnd
     */
    on(event: "trackEnd", listener: (player: Player, track: Track, payload: TrackEndEvent) => void): this;
    /**
     * Emitted when a track gets stuck during playback.
     * @event Manager#trackStuck
     */
    on(event: "trackStuck", listener: (player: Player, track: Track, payload: TrackStuckEvent) => void): this;
    /**
     * Emitted when a track has an error during playback.
     * @event Manager#trackError
     */
    on(event: "trackError", listener: (player: Player, track: Track | UnresolvedTrack, payload: TrackExceptionEvent) => void): this;
    /**
     * Emitted when a voice connection is closed.
     * @event Manager#socketClosed
     */
    on(event: "socketClosed", listener: (player: Player, payload: WebSocketClosedEvent) => void): this;
}
/**
 * The main hub for interacting with Lavalink and using Erela.JS,
 * @noInheritDoc
 */
export declare class Manager extends EventEmitter {
    static readonly DEFAULT_SOURCES: Record<SearchPlatform, string>;
    /** The map of players. */
    readonly players: Collection<string, Player>;
    /** The map of nodes. */
    readonly nodes: Collection<string, Node>;
    /** The options that were set. */
    readonly options: ManagerOptions;
    private initiated;
    /** Returns the least used Nodes. */
    get leastUsedNodes(): Collection<string, Node>;
    /** Returns the least system load Nodes. */
    get leastLoadNodes(): Collection<string, Node>;
    /**
     * Initiates the Manager class.
     * @param options
     */
    constructor(options: ManagerOptions);
    /**
     * Initiates the Manager.
     * @param clientId
     */
    init(clientId?: string): this;
    /**
     * Searches the enabled sources based off the URL or the `source` property.
     * @param query
     * @param requester
     * @returns The search result.
     */
    search(query: string | SearchQuery, requester?: unknown): Promise<SearchResult>;
    /**
     * Decodes the base64 encoded tracks and returns a TrackData array.
     * @param tracks
     */
    decodeTracks(tracks: string[]): Promise<TrackData[]>;
    /**
     * Decodes the base64 encoded track and returns a TrackData.
     * @param track
     */
    decodeTrack(track: string): Promise<TrackData>;
    /**
     * Creates a player or returns one if it already exists.
     * @param options
     */
    create(options: PlayerOptions): Player;
    /**
     * Returns a player or undefined if it does not exist.
     * @param guild
     */
    get(guild: string): Player | undefined;
    /**
     * Destroys a player if it exists.
     * @param guild
     */
    destroy(guild: string): void;
    /**
     * Creates a node or returns one if it already exists.
     * @param options
     */
    createNode(options: NodeOptions): Node;
    /**
     * Destroys a node if it exists.
     * @param identifier
     */
    destroyNode(identifier: string): void;
    /**
     * Sends voice data to the Lavalink server.
     * @param data
     */
    updateVoiceState(data: VoicePacket | VoiceServer | VoiceState): void;
}
export interface Payload {
    /** The OP code */
    op: number;
    d: {
        guild_id: string;
        channel_id: string | null;
        self_mute: boolean;
        self_deaf: boolean;
    };
}
export interface ManagerOptions {
    /** The array of nodes to connect to. */
    nodes?: NodeOptions[];
    /** The client ID to use. */
    clientId?: string;
    /** Value to use for the `Client-Name` header. */
    clientName?: string;
    /** The shard count. */
    shards?: number;
    /** A array of plugins to use. */
    plugins?: Plugin[];
    /** Whether players should automatically play the next song. */
    autoPlay?: boolean;
    /** An array of track properties to keep. `track` will always be present. */
    trackPartial?: string[];
    /** The default search platform to use, can be "youtube", "youtube music", or "soundcloud". */
    defaultSearchPlatform?: SearchPlatform;
    /**
     * Function to send data to the websocket.
     * @param id
     * @param payload
     */
    send(id: string, payload: Payload): void;
}
export declare type SearchPlatform = "youtube" | "youtube music" | "soundcloud";
export interface SearchQuery {
    /** The source to search from. */
    source?: SearchPlatform | string;
    /** The query to search for. */
    query: string;
}
export interface SearchResult {
    /** The load type of the result. */
    loadType: LoadType;
    /** The array of tracks from the result. */
    tracks: Track[];
    /** The playlist info if the load type is PLAYLIST_LOADED. */
    playlist?: PlaylistInfo;
    /** The exception when searching if one. */
    exception?: {
        /** The message for the exception. */
        message: string;
        /** The severity of exception. */
        severity: string;
    };
}
export interface PlaylistInfo {
    /** The playlist name. */
    name: string;
    /** The playlist selected track. */
    selectedTrack?: Track;
    /** The duration of the playlist. */
    duration: number;
}
export interface LavalinkResult {
    tracks: TrackData[];
    loadType: LoadType;
    exception?: {
        /** The message for the exception. */
        message: string;
        /** The severity of exception. */
        severity: string;
    };
    playlistInfo: {
        name: string;
        selectedTrack?: number;
    };
}
