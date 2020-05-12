declare module "erela.js" {
    import { EventEmitter } from "events";
    import WebSocket from "ws";

    export const version: string;
    type Type<T> = new (...args: any[]) => T;

    export class ErelaClient extends EventEmitter {
        constructor(client?: any, nodes?: INodesOptions[], options?: IErelaOptions);

        public readonly client: any;
        public readonly shardCount: number;
        public readonly userId: string;
        public readonly node: Type<Node>;
        public readonly player: Type<Player>;
        public readonly queue: Type<Queue>;
        public readonly track: Type<Track>;
        public readonly players: PlayerStore;
        public readonly nodes: NodeStore;
        public readonly library: any;

        public on(event: "playerCreate" | "playerDestroy" | "queueEnd", listener: (player: Player) => void): this;
        public on(event: "playerMove", listener: (player: Player, oldChannel: any, newChannel: any) => void): this;
        public on(event: "trackStart" | "trackEnd", listener: (player: Player, track: Track) => void): this;
        public on(event: "trackStuck" | "trackError", listener: (player: Player, track: Track, message: any) => void): this;
        public on(event: "socketClosed", listener: (player: Player, message: any) => void): this;
        public on(event: "nodeCreate" | "nodeDestroy" | "nodeConnect" | "nodeReconnect", listener: (node: Node) => void): this;
        public on(event: "nodeDisconnect" | "nodeError", listener: (node: Node, message: any) => void): this;

        public once(event: "playerCreate" | "playerDestroy" | "queueEnd", listener: (player: Player) => void): this;
        public once(event: "playerMove", listener: (player: Player, oldChannel: any, newChannel: any) => void): this;
        public once(event: "trackStart" | "trackEnd", listener: (player: Player, track: Track) => void): this;
        public once(event: "trackStuck" | "trackError", listener: (player: Player, track: Track, message: any) => void): this;
        public once(event: "socketClosed", listener: (player: Player, message: any) => void): this;
        public once(event: "nodeCreate" | "nodeDestroy" | "nodeConnect" | "nodeReconnect", listener: (node: Node) => void): this;
        public once(event: "nodeDisconnect" | "nodeError", listener: (node: Node, message: any) => void): this;

        public updateVoiceState(data: any): void;
        public search(query: string | IQuery, requester: any): Promise<SearchResult>;
        public sendWS(data: any): void;
    }
    
    export interface IQuery {
        source?: "youtube" | "soundcloud";
        query: string;
    }

    export interface IErelaOptions {
        readonly shardCount?: number;
        readonly player?: Type<Player>;
        readonly node?: Type<Node>;
        readonly track?: Type<Track>;
        readonly queue?: Type<Queue>;
        readonly userId?: string;
        readonly library?: string;
    }

    export class Player {
        constructor(erela: ErelaClient, node: Node, options: IPlayerOptions, extra: any);

        public readonly erela: ErelaClient;
        public readonly node: Node;
        public readonly options: IPlayerOptions;
        public readonly guild: any;
        public textChannel: any;
        public voiceChannel: any;
        public bands: IEqualizerBand[];
        public readonly queue: Queue;
        public volume: number;
        public playing: boolean;
        public position: number;
        public trackRepeat: boolean;
        public queueRepeat: boolean;

        public setVoiceChannel(channel: any): void;
        public setTextChannel(channel: any): void;
        public play(): void;
        public stop(): void;
        public pause(pause: boolean): void;
        public seek(position: number): void;
        public setVolume(volume: number): void;
        public setEQ(bands: IEqualizerBand[]): void;
        public setTrackRepeat(repeat: boolean): void;
        public setQueueRepeat(repeat: boolean): void;
    }

    export interface IPlayerOptions {
        readonly guild: any;
        readonly textChannel: any;
        readonly voiceChannel: any;
        readonly selfDeaf?: boolean;
        readonly selfMute?: boolean;
        readonly volume?: number;
    }

    export interface IEqualizerBand {
        readonly band: number;
        readonly gain: number;
    }

    export class Queue extends Array {
        constructor(erela: ErelaClient);

        public get duration(): number;
        public get size(): number;
        public get empty(): boolean;

        public add(track: Track|Track[], offset?: number): void;
        public removeFrom(start: number, end: number): Track[]|null;
        public remove(track: Track|number): Track|null;
        public clear(): void;
        public shuffle(): void;
    }

    export class Track {
        constructor(data: ITrackData, requester: any);

        public readonly track: string;
        public readonly identifier: string;
        public readonly isSeekable: boolean;
        public readonly author: string;
        public readonly duration: number;
        public readonly isStream: boolean;
        public readonly title: string;
        public readonly uri: string;
        public readonly requester: any;
        
        public displayThumbnail(size?): string;
    }

    export interface ITrackInfo {
        readonly identifier: string;
        readonly isSeekable: boolean;
        readonly author: string;
        readonly length: number;
        readonly isStream: boolean;
        readonly title: string;
        readonly uri: string;
    }

    export interface ITrackData {
        readonly track: string;
        readonly info: ITrackInfo;
    }

    export class Node {
        constructor(erela: ErelaClient, options: INodesOptions);

        public readonly erela: ErelaClient;
        public options: INodesOptions;
        public websocket: WebSocket | null;
        public stats: INodeStats;
        public reconnectTimeout: NodeJS.Timeout | undefined;
        public reconnectAttempts: number;
        public retryAmount: number;
        public retryDelay: number;
        public calls: number;
        public get connected(): boolean;

        public setOptions(options: INodesOptions): void;
        public connect(): void;
        public reconnect(): void;
        public destroy(): void;
        public send(data: any): Promise<boolean>;
    }

    export interface INodesOptions {
        readonly identifier?: string;
        readonly host: string;
        readonly port: number;
        readonly password: string;
        readonly retryAmount?: number;
        readonly retryDelay?: number;
    }

    export interface INodeStats {
        readonly players: number;
        readonly playingPlayers: number;
        readonly uptime: number;
        readonly memory: INodeMemoryStats;
        readonly cpu: INodeCPUStats;
        readonly frameStats: INodeFrameStats;
    }

    export interface INodeMemoryStats {
        readonly free: number;
        readonly used: number;
        readonly allocated: number;
        readonly reservable: number;
    }

    export interface INodeCPUStats {
        readonly cores: number;
        readonly systemLoad: number;
        readonly lavalinkLoad: number;
    }

    export interface INodeFrameStats {
        readonly sent?: number;
        readonly nulled?: number;
        readonly deficit?: number;
    }

    export class Store<K, V> extends Map {
        constructor(iterable?: Iterable<any>);

        public get(key: K): V | null;
        public set(key: K, value: V): this;
        public find(fn: (val: V, key: K, col: this) => boolean): V | null;
        public first(count?: number): V | V[];
        public filter(fn: (val: V, key: K, col: this) => boolean): this;
        public map(fn: (val: V, key: K, col: this) => any): this;
        public some(fn: (val: V, key: K, col: this) => any): this;
        public concat(...collections: Map<K, V>[]): Store<K, V>;
        public sort(fn: ((a: [any, any], b: [any, any]) => number) | undefined): Store<K, V>;
    }

    export class PlayerStore<K = string, V = Player> extends Store<K, V> {
        constructor(erela: ErelaClient);

        private readonly erela: ErelaClient;

        public spawn(options: IPlayerOptions, extra?: any): Player;
        public destroy(guildId: string): Player | null;
    }

    export class NodeStore<K = any, V = Node> extends Store<K, V> {
        constructor(erela: ErelaClient);

        private readonly erela: ErelaClient;
        public get leastUsed(): Store<any, Node>;
        public get leastLoad(): Store<any, Node>;

        public spawn(options: INodesOptions, extra?: any): Node;
        public destroy(nodeId: any): Node | null;
    }

    export class SearchResult {
        constructor(data: ISearchResultData, track: Type<Track>, requester: any);

        public readonly loadType: string;
        public readonly tracks: Track[];
        public readonly playlist: IPlaylist;
        public readonly exception: IException | null;
    }

    export interface ISearchResultData {
        readonly loadType: string;
        readonly playlistInfo: IPlaylistInfo;
        readonly tracks: ITrackData[];
        readonly exception?: IException;
    }

    export interface IPlaylistInfo {
        readonly name?: string;
        readonly selectedTrack?: ITrackData | null;
    }

    export interface IPlaylist {
        readonly info: IPlaylistInfo;
        readonly tracks: Track[];
        readonly duration: number;
    }

    export interface IException {
        readonly message: string;
        readonly severity: string;
    }

    export class Utils {
        public static formatTime(milliseconds: number, minimal: boolean): string;
        public static parseTime(time: string): number | null;
    }
}
