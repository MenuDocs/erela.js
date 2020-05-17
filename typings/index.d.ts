declare module 'structures/Node' {
	/// <reference types="node" />
	import { Track, Player } from 'structures/Player';
	import { Structure } from 'structures/Utils';
	import { Manager } from 'structures/Manager';
	import WebSocket from 'ws';
	/** The NodeOptions interface. */
	export interface NodeOptions {
	    /** The host for the node. */
	    readonly host: string;
	    /** The port for the node. */
	    readonly port: number;
	    /** The password for the node. */
	    readonly password: string;
	    /** The identifier for the node. */
	    readonly identifier?: string;
	    /** The retryAmount for the node. */
	    readonly retryAmount?: number;
	    /** The retryDelay for the node. */
	    readonly retryDelay?: number;
	}
	/** The Node class. */
	export class Node extends Structure {
	    manager: Manager;
	    options: NodeOptions;
	    /** The socket for the node. */
	    socket: WebSocket | null;
	    /** The amount of rest calls the node has made. */
	    calls: number;
	    /** The stats for the node. */
	    stats: any;
	    private reconnectTimeout?;
	    private reconnectAttempts;
	    /** Returns if connected to the Node. */
	    get connected(): boolean;
	    /**
	     * Creates an instance of Node.
	     * @param {Manager} manager The Manager.
	     * @param {NodeOptions} options The NodeOptions to pass.
	     */
	    constructor(manager: Manager, options: NodeOptions);
	    /** Connects to the Node. */
	    connect(): void;
	    /**
	     * Reconnects to the Node.
	     */
	    reconnect(): void;
	    /** Destroys the Node. */
	    destroy(): void;
	    /**
	     * Sends data to the Node.
	     * @param {any} data The data to send.
	     */
	    send(data: any): Promise<boolean>;
	    protected open(): void;
	    protected close(code: number, reason: string): void;
	    protected message(d: Buffer | string): void;
	    protected error(error: Error): void;
	    protected handleEvent(payload: any): void;
	    protected trackEnd(player: Player, track: Track, payload: any): void;
	    protected trackStart(player: Player, track: Track, payload: any): void;
	    protected trackStuck(player: Player, track: Track, payload: any): void;
	    protected trackError(player: Player, track: Track, payload: any): void;
	    protected socketClosed(player: Player, payload: any): void;
	}

}
declare module 'structures/Manager' {
	/// <reference types="node" />
	import { LoadType } from 'structures/Utils';
	import { Node, NodeOptions } from 'structures/Node';
	import { EventEmitter } from 'events';
	import { Player, Track } from 'structures/Player';
	/** The ManagerOptions interface. */
	export interface ManagerOptions {
	    /** The array of nodes to connect to. */
	    nodes?: NodeOptions[];
	    /** The client ID to use. */
	    clientId?: string;
	    /** The shard count. */
	    shards?: number;
	    /** A array of plugins to use. */
	    plugins?: any[];
	    /** Whether players should automatically play the next song. */
	    autoPlay?: boolean;
	    /**
	     * Function to send data to the websocket.
	     * @param {string} id The ID of the guild.
	     * @param {*} payload The payload to send.
	     */
	    send(id: string, payload: any): void;
	}
	/** The IQuery interface. */
	export interface IQuery {
	    /** The source to search from. */
	    source?: "youtube" | "soundcloud";
	    /** The query to search for. */
	    query: string;
	}
	/** The SearchResult interface. */
	export interface SearchResult {
	    /** The load type of the result. */
	    loadType: LoadType;
	    /** The array of tracks if the load type is SEARCH_RESULT or TRACK_LOADED. */
	    tracks?: Track[];
	    /** The playlist object if the load type is PLAYLIST_LOADED. */
	    playlist?: {
	        /** The playlist info object. */
	        info: {
	            /** The playlist name. */
	            name: string;
	            /** The playlist selected track. */
	            selectedTrack: Track;
	        };
	        /** The tracks in the playlist. */
	        tracks: Track[];
	        /** The duration of the playlist. */
	        length: number;
	    };
	}
	/** The Manager class. */
	export class Manager extends EventEmitter {
	    /** The map of players. */
	    readonly players: Map<string, Player>;
	    /** The map of nodes. */
	    readonly nodes: Map<string, Node>;
	    /** The options that were set. */
	    readonly options: ManagerOptions;
	    protected readonly voiceStates: Map<string, any>;
	    /**
	     * Creates the Manager class.
	     * @param {ManagerOptions} [options] The options to use.
	     */
	    constructor(options?: ManagerOptions);
	    /**
	     * Searches YouTube with the query.
	     * @param {(string|IQuery)} query - The query to search against.
	     * @param {any} user - The user who requested the tracks.
	     * @returns {Promise<SearchResult>} - The search result.
	     */
	    search(query: string | IQuery, user: any): Promise<SearchResult>;
	    /**
	     * Initiates the manager (with a client ID if none provided in ManagerOptions).
	     * @param {string} clientId The client ID to use.
	     */
	    init(clientId?: string): void;
	    /**
	     * Sends voice data to the Lavalink server.
	     * @param {*} data The data to send.
	     */
	    updateVoiceState(data: any): void;
	}

}
declare module 'structures/Queue' {
	import { Structure } from 'structures/Utils';
	import { Track } from 'structures/Player';
	export interface Queue extends Structure, Array<Track> {
	}
	/** The Queue class. */
	export class Queue {
	    /**
	     * Adds a track to the queue.
	     * @param {(Track|Track[])} track The track or tracks to add.
	     * @param {number} [offset=0] The offset to add the track at.
	     */
	    add(track: Track | Track[], offset?: number): void;
	}

}
declare module 'structures/Player' {
	/// <reference types="node" />
	import { Structure } from 'structures/Utils';
	import { EventEmitter } from 'events';
	import { Manager } from 'structures/Manager';
	import { Queue } from 'structures/Queue';
	import { Node } from 'structures/Node';
	/** The PlayerOptions interface. */
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
	    /** If the player should deafen itself. */
	    selfDeafen?: boolean;
	}
	/** The Track interface. */
	export interface Track {
	    /** The base64 encoded track. */
	    readonly track: string;
	    /** The title of the track. */
	    readonly title: string;
	    /** The identifier of the track. */
	    readonly identifier: string;
	    /** The author of the track. */
	    readonly author: string;
	    /** The length of the track. */
	    readonly length: number;
	    /** If the track is seekable. */
	    readonly isSeekable: boolean;
	    /** If the track is a stream.. */
	    readonly isStream: boolean;
	    /** The uri of the track. */
	    readonly uri: string;
	    /** The thumbnail of the track. */
	    readonly thumbnail: string;
	    /** The user that requested the track. */
	    readonly user: any;
	    /** Displays the track thumbnail with a size in "0", "1", "2", "3", "default", "mqdefault", "hqdefault", "maxresdefault". Only for youtube as others require an API. */
	    displayThumbnail(size?: string): string;
	}
	/** The PlayOptions interface */
	export interface PlayOptions {
	    /** The track to play. */
	    readonly track?: Track;
	    /** The position to start the track. */
	    readonly startTime?: number;
	    /** The position to end the track. */
	    readonly endTime?: number;
	    /** Whether to not replace the track if a play payload is sent. */
	    readonly noReplace?: boolean;
	}
	export interface Player extends Structure, EventEmitter {
	}
	/** The Player class. */
	export class Player {
	    options: PlayerOptions;
	    /** The Manager. */
	    static manager: Manager | null;
	    /** The Queue for the Player. */
	    readonly queue: Queue;
	    /** The Node for the Player. */
	    node: Node;
	    /** Whether the queue repeats the track. */
	    trackRepeat: boolean;
	    /** Whether the queue repeats the queue. */
	    queueRepeat: boolean;
	    /** The time the player is in the track. */
	    position: number;
	    /** Whether the player is playing. */
	    playing: boolean;
	    static init(manager: Manager): void;
	    get connected(): boolean;
	    /**
	     * Creates a new player, returns one if it already exists.
	     * @param {PlayerOptions} options The options to pass.
	     */
	    constructor(options: PlayerOptions);
	    /**
	     * Connect to the voice channel. Will use the voice channel set in PlayerOptions.
	     * @param {string} [voiceChannel=null] The voice channel to join.
	     */
	    connect(voiceChannel?: string): void;
	    play(options?: PlayOptions): void;
	}

}
declare module 'structures/Utils' {
	import { Track } from 'structures/Player';
	export function buildTrack(data: any, user: any): Track;
	export function mix(derivedCtor: any, ...baseCtors: any[]): void;
	/** The Structure class. */
	export class Structure {
	    /**
	     * Extends a class.
	     * @param {(any) => any} extender
	     */
	    static extend(extender: (any: any) => any): void;
	    /**
	     * Returns the structure.
	     * @param {keyof Structures} structure
	     */
	    static get(structure: keyof typeof Structures): any;
	}
	export enum LoadType {
	    TRACK_LOADED = "TRACK_LOADED",
	    PLAYLIST_LOADED = "PLAYLIST_LOADED",
	    SEARCH_RESULT = "SEARCH_RESULT",
	    LOAD_FAILED = "LOAD_FAILED"
	} const Structures: {
	    Player: any;
	    Queue: any;
	    Node: any;
	};
	export {};

}
declare module 'index' {
	export { Structure } from 'structures/Utils';
	export { Manager } from 'structures/Manager';
	export { Player } from 'structures/Player';
	export { Queue } from 'structures/Queue';
	export { Node } from 'structures/Node';

}
declare module 'erela.js' {
	export * from 'index';
}
