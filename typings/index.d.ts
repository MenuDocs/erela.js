declare module "erela.js" {
	import { EventEmitter } from "events"
	export type Type<T> = new (...args: any[]) => T;
	/**
	 * The Utils class.
	 */
	export class Utils {
	    /**
	     * Formats the given duration into human readable format.
	     * @param {number} milliseconds The duration to format.
	     * @param {boolean?} [minimal=false] Whether to use a minimal format.
	     * @returns {string} The formatted duration.
	     */
	    static formatTime(milliseconds: number, minimal?: boolean): string;
	    /**
	     * Parses the given duration into milliseconds.
	     * @param {string} time The duration to parse.
	     * @returns {(number|null)} The parsed duration, null if it could not be parsed..
	     */
	    static parseTime(time: string): number | null;
	}
	/**
	 * The Classes class for managing extending classes.
	 */
	export class Classes {
	    /**
	     * Returns the Class.
	     * @param {string} name
	     * @returns {(Function | any)} The class, or null if it does not exist.
	     */
	    static get(name: string): Function | any;
	    /**
	     * Extends a class to add additional functionality.
	     * @param {string} name The Class name.
	     * @param {(clazz: Type<any>) => Type<any>} extender The Function to return the extended Class.
	     */
	    static extend(name: string, extender: (clazz: Type<any>) => Type<any>): void;
	}

	/**
	 * The ITrackInfo interface.
	 */
	export interface ITrackInfo {
	    /**
	     * The track's identifier.
	     */
	    readonly identifier: string;
	    /**
	     * Whether the track is seekable.
	     */
	    readonly isSeekable: boolean;
	    /**
	     * The author of the track.
	     */
	    readonly author: string;
	    /**
	     * The track's length.
	     */
	    readonly length: number;
	    /**
	     * Whether the track is a string.
	     */
	    readonly isStream: boolean;
	    /**
	     * The track's title.
	     */
	    readonly title: string;
	    /**
	     * The track's URI.
	     */
	    readonly uri: string;
	}
	/**
	 * The ITrackData interface.
	 */
	export interface ITrackData {
	    /**
	     * The base 64 encoded track.
	     */
	    readonly track: string;
	    /**
	     * The tracks info.
	     */
	    readonly info: ITrackInfo;
	}
	/**
	 * The Track class.
	 */
	export class Track {
	    /**
	     * The base 64 encoded track.
	     */
	    readonly track: string;
	    /**
	     * The track's identifier.
	     */
	    readonly identifier: string;
	    /**
	     * Whether the track is seekable.
	     */
	    readonly isSeekable: boolean;
	    /**
	     * The author of the track.
	     */
	    readonly author: string;
	    /**
	     * The track's duration.
	     */
	    readonly duration: number;
	    /**
	     * Whether the track is a string.
	     */
	    readonly isStream: boolean;
	    /**
	     * The track's title.
	     */
	    readonly title: string;
	    /**
	     * The track's URL.
	     */
	    readonly url: string;
	    /**
	     * The track's URI.
	     */
	    readonly uri: string;
	    /**
	     * The user who requested the track.
	     */
	    readonly requester: any;
	    /**
	     * Creates an instance of Track.
	     * @param {ITrackData} data The data to pass.
	     * @param {any} user The user who requested the track.
	     */
	    constructor(data: ITrackData, requester: any);
	    /**
	     * Returns the thumbnail for the track. Only works for YouTube videos due to other sources requiring a API token.
	     * Sizes that work: "0", "1", "2", "3", "default", "mqdefault", "hqdefault", "maxresdefault".
	     * @param {string} [size] The size for the track.
	     * @returns {string} The URL with the specified size, or the default one.
	     */
	    displayThumbnail(size?: string): string;
	}
	/**
	 * The Queue class.
	 * @noInheritDoc
	 */
	export class Queue extends Array {
	    readonly erela: ErelaClient;
	    /**
	     * Returns the total duration of the queue.
	     * @returns {number} The duration of the queue.
	     */
	    get duration(): number;
	    /**
	     * Returns the size of the queue.
	     * @returns {number} The size of the queue.
	     */
	    get size(): number;
	    /**
	     * Returns if the queue is empty or not.
	     * @returns {boolean} If the queue is empty or not.
	     */
	    get empty(): boolean;
	    /**
	     * Creates an instance of Queue.
	     * @param {ErelaClient} erela The Erela Client.
	     */
	    constructor(erela: ErelaClient);
	    /**
	     * Adds a track to the queue.
	     * @param {(Track|Track[])} track The track or tracks to add.
	     * @param {number} [offset=0] The offset to add the track at.
	     */
	    add(track: Track | Track[], offset?: number): void;
	    /**
	     * Removes several track from the queue within a range.
	     * @param {number} track The track to remove.
	     * @returns {(Track[]|null)} The tracks that was removed, or null if the tracks do not exist.
	     */
	    removeFrom(start: number, end: number): Track[] | null;
	    /**
	     * Removes a track from the queue. Defaults to the first track.
	     * @param {(Track|number)} [track=0] The track to remove.
	     * @returns {(Track|null)} The track that was removed, or null if the track does not exist.
	     */
	    remove(track?: Track | number): Track | null;
	    /**
	     * Clears the queue.
	     */
	    clear(): void;
	    /**
	     * Shuffles the queue.
	     */
	    shuffle(): void;
	}
	/**
	 * The IPlayerOptions interface.
	 */
	export interface IPlayerOptions {
	    /**
	     * The guild to connect to.
	     */
	    guild: string;
	    /**
	     * The text channel to connect to.
	     */
	    textChannel: string;
	    /**
	     * The voice channel to connect to.
	     */
	    voiceChannel: string;
	    /**
	     * Whether to deafen the client.
	     */
	    selfDeaf?: boolean;
	    /**
	     * Whether to mute the client.
	     */
	    selfMute?: boolean;
	    /**
	     * The volume to set the player at.
	     */
	    volume?: number;
	}
	/**
	 * The IEqualizerBand interface.
	 */
	export interface IEqualizerBand {
	    /**
	     * The band for the equalizer band.
	     */
	    band: number;
	    /**
	     * The gain for the equalizer band.
	     */
	    gain: number;
	}
	export interface IPlayOptions {
	    /**
	     * The position to start the track.
	     */
	    readonly startTime?: number;
	    /**
	     * The position to end the track.
	     */
	    readonly endTime?: number;
	    /**
	     * Whether to not replace the track if a play playload is sent.
	     */
	    readonly noReplace?: boolean;
	}
	/**
	 * The Player class.
	 */
	export class Player {
	    readonly erela: ErelaClient;
	    /**
	     * The players node.
	     */
	    readonly node: Node;
	    /**
	     * The players options.
	     */
	    readonly options: IPlayerOptions;
	    /**
	     * The players guild it's connected to.
	     */
	    readonly guild: any;
	    /**
	     * The players text channel it's connected to.
	     */
	    textChannel: any;
	    /**
	     * The players voice channel it's connected to.
	     */
	    voiceChannel: any;
	    /**
	     * The players equalizer bands.
	     */
	    bands: IEqualizerBand[];
	    /**
	     * The players queue.
	     */
	    readonly queue: Queue;
	    /**
	     * The players current volume.
	     */
	    volume: number;
	    /**
	     * Whether the player is playing.
	     */
	    playing: boolean;
	    /**
	     * The players current position in the track.
	     */
	    position: number;
	    /**
	     * Whether the player is repeating the current track.
	     */
	    trackRepeat: boolean;
	    /**
	     * Whether the player is repeating the queue.
	     */
	    queueRepeat: boolean;
	    /**
	     * Creates an instance of Player.
	     * @param {ErelaClient} erela The Erela client.
	     * @param {Node} node The Erela Node.
	     * @param {IPlayerOptions} options The player options.
	     */
	    constructor(erela: ErelaClient, node: Node, options: IPlayerOptions);
	    /**
	     * Plays the next track in the queue.
	     * @param {IPlayOptions} [options={}] The options to send when playing a track.
	     */
	    play(options?: IPlayOptions): void;
	    /**
	     * Sets the players volume.
	     * @param {number} volume The volume to set.
	     */
	    setVolume(volume: number): void;
	    /**
	     * Sets the players equalizer. Pass a empty array to reset the bands.
	     * @param {EqualizerBand[]} bands The array of bands to set.
	     * @example
	     * player.setEQ([
	     *      { band: 0, gain: 0.15 },
	     *      { band: 1, gain: 0.15 },
	     *      { band: 2, gain: 0.15 }
	     * ]);
	     */
	    setEQ(bands: IEqualizerBand[]): void;
	    /**
	     * Sets the track repeat.
	     * @param {boolean} repeat If track repeat should be enabled.
	     */
	    setTrackRepeat(repeat: boolean): void;
	    /**
	     * Sets the queue repeat.
	     * @param {boolean} repeat If queue repeat should be enabled.
	     */
	    setQueueRepeat(repeat: boolean): void;
	    /**
	     * Stops the current track.
	     */
	    stop(): void;
	    /**
	     * Pauses the current track.
	     * @param {boolean} pause Whether to pause the current track.
	     */
	    pause(pause: boolean): void;
	    /**
	     * Seeks to the position in the current track.
	     * @param {boolean} pause Whether to pause the current track.
	     */
	    seek(position: number): void;
	    /**
	     * Destroys the player.
	     */
	    destroy(): void;
	}
	/**
	 * The INodeOptions interface.
	 */
	export interface INodeOptions {
	    /**
	     * The Nodes custom identifier.
	     */
	    readonly identifer?: string;
	    /**
	     * The host for the node.
	     */
	    readonly host: string;
	    /**
	     * The port for the node.
	     */
	    readonly port: number;
	    /**
	     * The password for the node.
	     */
	    readonly password: string;
	    /**
	     * The retry amount for the node.
	     */
	    readonly retryAmount?: number;
	    /**
	     * The retry delay for the node.
	     */
	    readonly retryDelay?: number;
	}
	/**
	 * The INodeMemoryStats interface.
	 */
	export interface INodeMemoryStats {
	    /**
	     * The free memory.
	     */
	    free: number;
	    /**
	     * The used memory.
	     */
	    used: number;
	    /**
	     * The allocated memory.
	     */
	    allocated: number;
	    /**
	     * The reservable memory.
	     */
	    reservable: number;
	}
	/**
	 * The INodeCPUStats interface.
	 */
	export interface INodeCPUStats {
	    /**
	     * The amount of cores on the CPU.
	     */
	    cores: number;
	    /**
	     * The system load on the cores on the CPU.
	     */
	    systemLoad: number;
	    /**
	     * The lavalink load on the cores on the CPU.
	     */
	    lavalinkLoad: number;
	}
	/**
	 * The INodeFrameStats interface.
	 */
	export interface INodeFrameStats {
	    /**
	     * The amount of sent frames.
	     */
	    sent?: number;
	    /**
	     * The amount of nulled frames.
	     */
	    nulled?: number;
	    /**
	     * The amount of deficit frames.
	     */
	    deficit?: number;
	}
	/**
	 * The INodeStats interface.
	 * @interface INodeStats
	 */
	export interface INodeStats {
	    /**
	     * The amount of players on the node.
	     */
	    players: number;
	    /**
	     * The amount of players playing on the node.
	     */
	    playingPlayers: number;
	    /**
	     * The duration the node has been up.
	     */
	    uptime: number;
	    /**
	     * The nodes memory stats.
	     */
	    memory: INodeMemoryStats;
	    /**
	     * The nodes CPU stats.
	     */
	    cpu: INodeCPUStats;
	    /**
	     * The nodes frame stats.
	     */
	    frameStats?: INodeFrameStats;
	}
	/**
	 * The Node class.
	 */
	export class Node {
	    readonly erela: ErelaClient;
	    /**
	     * The options for the new.
	     */
	    options: INodeOptions;
	    /**
	     * The stats for the node.
	     */
	    stats: INodeStats;
	    /**
	     * The amount of REST calls the node has made.
	     */
	    calls: number;
	    private reconnectTimeout?;
	    private reconnectAttempts;
	    private websocket;
	    /**
	     * Returns if connected to the Node.
	     */
	    get connected(): boolean;
	    /**
	     * Creates an instance of Node and connects after being created.
	     * @param {ErelaClient} erela The Erela client.
	     * @param {INodeOptions} options The Node options.
	     */
	    constructor(erela: ErelaClient, options: INodeOptions);
	    /**
	     * Changes the node options and reconnects.
	     * @param {INodeOptions} options The new Nodes options.
	     */
	    setOptions(options: INodeOptions): void;
	    /**
	     * Connects to the Node.
	     */
	    connect(): void;
	    /**
	     * Reconnects to the Node.
	     */
	    reconnect(): void;
	    /**
	     * Destroys the Node.
	     */
	    destroy(): void;
	    /**
	     * Sends data to the Node.
	     * @param {any} data The data to send.
	     */
	    send(data: any): Promise<boolean>;
	    private open;
	    private close;
	    private message;
	    private error;
	    private handleEvent;
	    private trackEnd;
	    private trackStuck;
	    private trackError;
	    private socketClosed;
	}
	/**
	 * The IException interface
	 */
	export interface IException {
	    /**
	     * The message for the exception.
	     */
	    readonly message: string;
	    /**
	     * The severity of the exception.
	     */
	    readonly severity: string;
	}
	/**
	 * The IPlaylist class.
	 */
	export interface IPlaylist {
	    /**
	     * The info for the playlist.
	     */
	    readonly info: IPlaylistInfo;
	    /**
	     * The tracks for the playlist.
	     */
	    readonly tracks: Track[];
	    /**
	     * The total duration of the playlist.
	     */
	    readonly duration: number;
	}
	/**
	 * The playlists info.
	 */
	export interface IPlaylistInfo {
	    /**
	     * The name of the playlist.
	     */
	    readonly name?: string;
	    /**
	     * The selected track of the playlist.
	     */
	    readonly selectedTrack?: ITrackData | null;
	}
	export interface ISearchResultData {
	    readonly loadType: string;
	    readonly playlistInfo: IPlaylistInfo;
	    readonly tracks: ITrackData[];
	    readonly exception?: IException;
	}
	/**
	 * The SearchResult class.
	 */
	export class SearchResult {
	    /**
	     * The load type of the search result.
	     */
	    readonly loadType: string;
	    /**
	     * The tracks of the search result.
	     */
	    readonly tracks: Track[];
	    /**
	     * The playlist of the search result.
	     */
	    readonly playlist: IPlaylist;
	    /**
	     * The exception of the search result if one occurred.
	     */
	    readonly exception: IException | undefined;
	    /**
	     * Creates an instance of SearchResult.
	     * @param {any} data The search result data.
	     * @param {Type<Track>} track The Track class.
	     * @param {any} user The user who requested the track.
	     */
	    constructor(data: ISearchResultData, track: Type<Track>, user: any);
	}

	/**
	 * The Store class, same as Map.
	 */
	export class Store<K, V> extends Map {
	    /**
	     * Creates an instance of Store.
	     * @param {Iterable<any>} [iterable] The data to store upon creation.
	     */
	    constructor(iterable?: Iterable<any>);
	    /**
	     * Gets a value from the Store.
	     * @param {K} key The key to use.
	     * @returns {(V|undefined)} The value from the Store.
	     */
	    get(key: K): V | undefined;
	    /**
	     * Sets a value in the Store.
	     * @param {K} key The key to use.
	     * @param {V} value The value to set.
	     * @returns {this} The Store.
	     */
	    set(key: K, value: V): this;
	    /**
	     * Finds an value using a callback function.
	     * @param {(val: V, key: K, col?: Store<K, V>) => boolean} fn The callback function.
	     * @returns {(V|null)} The value from the Store, null if it does not exist.
	     */
	    find(fn: (val: V, key: K, col?: Store<K, V>) => boolean): V | null;
	    /**
	     * Returns the first value from Store, or an array of the first values.
	     * @param {number} [count] The amount to return.
	     * @returns {(V|V[])} The value or array of values.
	     */
	    first(count?: number): V | V[];
	    /**
	     * Filters the Store to return a Store based on a callback function.
	     * @param {(val: V, key: K, col: Store<K, V>) => boolean} fn  The callback function.
	     * @returns {Store<K, V>} The filter Store.
	     */
	    filter(fn: (val: V, key: K, col: Store<K, V>) => boolean): Store<K, V>;
	    /**
	     * Maps the Store to return an array based on a callback function.
	     * @param {(val: V, key: K, col: Store<K, V>) => any} fn The callback function.
	     * @returns {any[]} An array of values based on what the callback function returns.
	     */
	    map(fn: (val: V, key: K, col: Store<K, V>) => any): any[];
	    /**
	     * Determines whether the specified callback function returns true for any element in the Store.
	     * @param {(val: V, key: K, col: Store<K, V>) => boolean} fn The callback function.
	     * @returns {boolean} Whether a value was found.
	     */
	    some(fn: (val: V, key: K, col: Store<K, V>) => boolean): boolean;
	    /**
	     * Sorts the Store with the callback function.
	     * @param {*} [compareFunction=(x: V, y: V) => + (x > y) || +(x === y) - 1] The callback function.
	     * @returns {Store<K, V>} The sorted Store.
	     */
	    sort(compareFunction?: (x: V, y: V) => number): Store<K, V>;
	}
	/**
	 * The PlayerStore class.
	 */
	export class PlayerStore extends Store<string, Player> {
	    readonly erela: ErelaClient;
	    /**
	     * Creates an instance of PlayerStore.
	     * @param {ErelaClient} erela The ErelaClient.
	     */
	    constructor(erela: ErelaClient);
	    /**
	     * Spawns a Player, or returns the Player if it exists.
	     * @param {IPlayerOptions} options The options to spawn a Player with.
	     * @returns {Player} The newly created Player, or the existing Player.
	     */
	    spawn(options: IPlayerOptions): Player;
	    /**
	     * Destroys a Player.
	     * @param {string} guildId The guild ID to destroy the Player with.
	     * @returns {(Player|null)} The Player or null if it does not exist.
	     */
	    destroy(guildId: string): Player | null;
	}
	/**
	 * The IPlugin interface.
	 */
	export interface IPlugin {
	    /**
	     * The name for the plugin.
	     */
	    name: string;
	    /**
	     * The values that should be passed to the plugin.
	     */
	    values?: any[];
	    /**
	     * The plugin reference.
	     */
	    plugin: Type<Plugin>;
	}
	/**
	 * The Plugin class for adding additional functionality.
	 */
	export class Plugin {
		[property: string]: any;

	    readonly erela: ErelaClient;
	    /**
	     * Creates an instance of Plugin.
	     * @param {ErelaClient} erela The ErelaClient.
	     */
	    constructor(erela: ErelaClient);
	    /**
	     * Runs when the plugin is loaded.
	     */
	    load(): void;
	    /**
	     * Runs when the plugin is unloaded.
	     */
	    unload(): void;
	}
	/**
	 * The PluginStore class.
	 */
	export class PluginStore extends Store<string, Plugin> {
	    readonly erela: ErelaClient;
	    /**
	     * Creates an instance of PluginStore.
	     * @param {ErelaClient} erela - The ErelaClient.
	     */
	    constructor(erela: ErelaClient);
	    /**
	     * Loads a Plugin.
	     * @param {IPlugin} options The options to load a Plugin.
	     */
	    load(options: IPlugin): void;
	    /**
	     * Unloads a Plugin.
	     * @param {string} name The name of the plugin to remove.
	     */
	    unload(name: string): void;
	}
	/**
	 * The NodeStore class.
	 */
	export class NodeStore extends Store<string, Node> {
	    readonly erela: ErelaClient;
	    /**
	     * Filters the connected nodes and sorts them by the amount of rest calls it has made.
	     */
	    get leastUsed(): Store<any, Node>;
	    /**
	     * Filters the connected nodes and sorts them by the least resource usage.
	     */
	    get leastLoad(): Store<any, Node>;
	    /**
	     * Creates an instance of NodeStore.
	     * @param {ErelaClient} erela The ErelaClient.
	     */
	    constructor(erela: ErelaClient);
	    /**
	     * Adds a new Node.
	     * @param {INodeOptions} node The node options.
	     */
	    spawn(options: INodeOptions): void;
	    /**
	     * Removes a new Node.
	     * @param {any} identifer The node identifer (or host if none was provided).
	     * @returns {(INode|null)} The node that was removed, or null if it does not exist.
	     */
	    remove(identifer: any): Node | null;
	}
	/**
	 * The IErelaOptions interface.
	 */
	export interface IErelaOptions {
	    /**
	     * Shard count.
	     */
	    shardCount?: number;
	    /**
	     * Directory to load local plugins from.
	     */
	    plugins?: string | IPlugin[];
	    /**
	     * The client's user ID.
	     */
	    userId?: string;
	    /**
	     * Tells Erela whether some values will be initiated later.
	     */
	    late?: string[] | ["NodeStore"];
	    /**
	     * Whether to automatically play tracks after they've ended. Defaults to true.
	     */
	    autoPlay?: boolean;
	}
	/**
	 * The IQuery interface.
	 */
	export interface IQuery {
	    /**
	     * The source to search from.
	     */
	    source?: "youtube" | "soundcloud";
	    /**
	     * The query to search for.
	     */
	    query: string;
	}
	interface IEvents {
	    on(event: "playerCreate" | "playerDestroy" | "queueEnd", listener: (player: Player) => void): this;
	    on(event: "playerMove", listener: (player: Player, oldChannel: any, newChannel: any) => void): this;
	    on(event: "trackStart" | "trackEnd", listener: (player: Player, track: Track) => void): this;
	    on(event: "trackStuck" | "trackError", listener: (player: Player, track: Track, message: any) => void): this;
	    on(event: "socketClosed", listener: (player: Player, message: any) => void): this;
	    on(event: "nodeCreate" | "nodeDestroy" | "nodeConnect" | "nodeReconnect", listener: (node: Node) => void): this;
	    on(event: "nodeDisconnect" | "nodeError", listener: (node: Node, message: any) => void): this;
	    once(event: "playerCreate" | "playerDestroy" | "queueEnd", listener: (player: Player) => void): this;
	    once(event: "playerMove", listener: (player: Player, oldChannel: any, newChannel: any) => void): this;
	    once(event: "trackStart" | "trackEnd", listener: (player: Player, track: Track) => void): this;
	    once(event: "trackStuck" | "trackError", listener: (player: Player, track: Track, message: any) => void): this;
	    once(event: "socketClosed", listener: (player: Player, message: any) => void): this;
	    once(event: "nodeCreate" | "nodeDestroy" | "nodeConnect" | "nodeReconnect", listener: (node: Node) => void): this;
	    once(event: "nodeDisconnect" | "nodeError", listener: (node: Node, message: any) => void): this;
	}
	/**
	 * The Erela class.
	 * @noInheritDoc
	 */
	export class ErelaClient extends EventEmitter implements IEvents {
	    /**
	     * Emitted when a player is created.
	     * @event ErelaClient#playerCreate
	     * @param {Player} player The created player.
	     */
	    /**
	     * Emitted when a player is destroyed.
	     * @event ErelaClient#playerDestroy
	     * @param {Player} player The destroyed player.
	     */
	    /**
	     * Emitted when a player is moved to a new channel.
	     * @event ErelaClient#playerMove
	     * @param {Player} player The moved player.
	     * @param {any} oldChannel The old voice channel.
	     * @param {any} newChannel The new voice channel.
	     */
	    /**
	     * Emitted when a track is started.
	     * @event ErelaClient#trackStart
	     * @param {Player} player The player that has the track.
	     * @param {Track} track The track that started.
	     */
	    /**
	     * Emitted when a track ends.
	     * @event ErelaClient#trackEnd
	     * @param {Player} player The player that has the track.
	     * @param {Track} track The track that ended.
	     */
	    /**
	     * Emitted when a track gets stuck during playback.
	     * @event ErelaClient#trackStuck
	     * @param {Player} player The player that has the track.
	     * @param {Track} track The track that got stuck.
	     * @param {*} message The message for the event.
	     */
	    /**
	     * Emitted when a track errors during playback.
	     * @event ErelaClient#trackError
	     * @param {Player} player The player that has the track.
	     * @param {Track} track The track that errored.
	     * @param {*} message The message for the event.
	     */
	    /**
	     * Emitted when a queue ends.
	     * @event ErelaClient#queueEnd
	     * @param {Player} player The player who's queue has ended.
	     */
	    /**
	     * Emitted when a player voice channel connected is closed.
	     * @event ErelaClient#socketClosed
	     * @param {Player} player The player.
	     * @param {any} message The message.
	     */
	    /**
	     * Emitted when a node is created.
	     * @event ErelaClient#nodeCreate
	     * @param {Node} node The created node.
	     */
	    /**
	     * Emitted when a node connects.
	     * @event ErelaClient#nodeConnect
	     * @param {Node} node The node that connected.
	     */
	    /**
	     * Emitted when a node reconnects.
	     * @event ErelaClient#nodeReconnect
	     * @param {Node} node The node that reconnected.
	     */
	    /**
	     * Emitted when a node encounters an error.
	     * @event ErelaClient#nodeError
	     * @param {Node} node The node.
	     * @param {Error} error The error.
	     */
	    /**
	     * Emitted when a node disconnects abnormally.
	     * @event ErelaClient#nodeDisconnect
	     * @param {Node} node The node.
	     * @param {Error} error The error.
	     */
	    /**
	     * Uses a plugin.
	     */
	    static use(plugin: IPlugin): void;
	    /**
	     * ErelaClient options.
	     */
	    options: IErelaOptions;
	    /**
	     * The PluginStore collection.
	     */
	    readonly plugins: PluginStore;
	    /**
	     * The PlayerStore collection.
	     */
	    readonly players: PlayerStore;
	    /**
	     * The NodeStore.
	     */
	    readonly nodes: NodeStore;
	    /**
	     * A Map of the classes Erela uses.
	     */
	    readonly classes: typeof Classes;
	    private readonly voiceState;
	    /**
	     * Creates an instance of ErelaClient.
	     * @param {INodeOptions[]} [nodes=[{host:"localhost",port:2333,password:"youshallnotpass"}] The nodes to use.
	     * @param {IErelaOptions} [options=defaultOptions] Options for the client.
	     */
	    constructor(nodes?: INodeOptions[] | IErelaOptions, options?: IErelaOptions);
	    /**
	     * Sends voice data to the Lavalink server.
	     * @param {*} data TThe data to send.
	     */
	    updateVoiceState(data: any): void;
	    /**
	     * Searches YouTube with the query.
	     * @param {(string|IQuery)} query The query to search against.
	     * @param {any} user The user who requested the tracks.
	     * @returns {Promise<SearchResult>} The search result.
	     */
	    search(query: string | IQuery, user: any): Promise<SearchResult>;
	}

	export enum LoadType {
	    TRACK_LOADED = "TRACK_LOADED",
	    PLAYLIST_LOAD = "PLAYLIST_LOADED",
	    SEARCH_RESULT = "SEARCH_RESULT",
	    LOAD_FAILED = "LOAD_FAILED",
	    NO_RESULTS = "NO_RESULTS"
	}

	export enum Status {
	    CONNECTED = "CONNECTED",
	    CONNECTING = "CONNECTING",
	    DISCONNECTED = "DISCONNECTED",
	    DISCONNECTING = "DISCONNECTING"
	}
}
