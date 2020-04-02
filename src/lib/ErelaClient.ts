// tslint:disable-next-line: no-var-requires
import { Node, INodeOptions } from "./classes/Node";
import { SearchResult } from "./classes/SearchResult";
import { PlayerStore } from "./stores/PlayerStore";
import { PluginStore } from "./stores/PluginStore";
import { NodeStore } from "./stores/NodeStore";
import { Classes } from "./utils/Classes";
import { EventEmitter } from "events";
import { IPlugin } from "./classes/Plugin";
import { Player } from "./classes/Player";
import { Track } from "./classes/Track";
import Axios from "axios";
import _ from "lodash";
import fs from "fs";

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
    late?: string[] | [ "NodeStore" ];
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

const plugins = new Set<IPlugin>();
const defaultOptions: IErelaOptions = {
    shardCount: 1,
    late: [],
    autoPlay: true,
};

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
    public static use(plugin: IPlugin) {
        plugins.add(plugin);
    }
    /**
     * ErelaClient options.
     */
    public options: IErelaOptions;
    /**
     * The PluginStore collection.
     */
    public readonly plugins!: PluginStore;
    /**
     * The PlayerStore collection.
     */
    public readonly players!: PlayerStore;
    /**
     * The NodeStore.
     */
    public readonly nodes!: NodeStore;
    /**
     * A Map of the classes Erela uses.
     */
    public readonly classes = Classes;
    private readonly voiceState: Map<string, any> = new Map();

    /**
     * Creates an instance of ErelaClient.
     * @param {INodeOptions[]} [nodes=[{host:"localhost",port:2333,password:"youshallnotpass"}] The nodes to use.
     * @param {IErelaOptions} [options=defaultOptions] Options for the client.
     */
    public constructor(nodes?: INodeOptions[] | IErelaOptions, options?: IErelaOptions) {
        super();

        // @ts-ignore
        if (process._erela_client_defined) { return; }

        let _nodes = [{ host: "localhost", port: 2333, password: "youshallnotpass" }];
        let _options = defaultOptions;

        const isObject = (obj: any) =>  typeof obj !== "undefined" && JSON.stringify(obj)[0] === "{";

        if (_.isArray(nodes) && isObject(options)) { // nodes, options
            _nodes = nodes;
            _options = options;
        } else if (_.isArray(nodes) && _.isUndefined(options)) { // nodes
            _nodes = nodes;
        } else if (isObject(nodes) && _.isUndefined(options)) { // options
            _options = nodes as unknown as IErelaOptions;
        }

        _options = { ...defaultOptions, ..._options };

        if (_options.plugins) {
            if (typeof _options.plugins === "string") {
                fs.readdirSync(_options.plugins)
                    .map((file) => require(`${_options.plugins}/${file}`)())
                    .map((plugin: IPlugin) => plugins.add(plugin));
            } else if (Array.isArray(_options.plugins)) {
                _options.plugins.map((plugin) => plugins.add(plugin));
            }
        }

        this.options = _options;
        this.plugins = new PluginStore(this);
        this.players = new PlayerStore(this);
        this.nodes = new NodeStore(this);

        for (const plugin of plugins) {
            this.plugins.load(plugin);
        }

        if (!_options.late.includes("NodeStore")) {
            for (const node of _nodes) {
                this.nodes.spawn(node);
            }
        }
    }

    /**
     * Sends voice data to the Lavalink server.
     * @param {*} data TThe data to send.
     */
    public updateVoiceState(data: any): void  {
        if (!data || !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(data.t || "")) {
            return;
        }
        const player = this.players.get(data.d.guild_id);

        if (!player) { return; }

        const state = this.voiceState.get(data.d.guild_id) || {};

        if (data.t === "VOICE_SERVER_UPDATE") {
            state.op = "voiceUpdate";
            state.guildId = data.d.guild_id;
            state.event = data.d;
        } else {
            if (data.d.user_id !== this.options.userId) {
                return;
            }
            state.sessionId = data.d.session_id;
            const channel = player.voiceChannel.id || player.voiceChannel;
            if (channel !== data.d.channel_id) {
                const currentChannel = player.voiceChannel;
                const newChannel = data.d.channel_id;
                this.emit("playerMove", player, currentChannel, newChannel);
                player.voiceChannel = newChannel;
            }
        }

        this.voiceState.set(data.d.guild_id, state);
        const template = JSON.stringify(["op", "guildId", "sessionId", "event"].sort());

        if (JSON.stringify(Object.keys(state).sort()) === template) {
            player.node.send(state);
            this.voiceState.set(data.d.guild_id, {});
        }
    }

    /**
     * Searches YouTube with the query.
     * @param {(string|IQuery)} query The query to search against.
     * @param {any} user The user who requested the tracks.
     * @returns {Promise<SearchResult>} The search result.
     */
    public search(query: string | IQuery, user: any): Promise<SearchResult> {
        return new Promise(async (resolve, reject) => {
            const node: Node = this.nodes.leastUsed.first() as Node;

            if (!node) {
                throw new Error("ErelaClient#search() No available nodes.");
            }

            const source = { soundcloud: "sc" }[(query as IQuery).source] || "yt";
            let search = (query as IQuery).query || query as string;

            if (!/^https?:\/\//.test(search)) {
                search = `${source}search:${search}`;
            }

            const url = `http://${node.options.host}:${node.options.port}/loadtracks`;

            const res = await Axios.get(url, {
                headers: { Authorization: node.options.password },
                params: { identifier: search },
            }).catch((err) => {
                return reject(err);
            });

            node.calls++;

            if (!res || !res.data || !res.data.tracks) {
                return reject(new Error("No data returned from query."));
            }

            if (!res.data.tracks[0]) {
                return reject(new Error("No tracks were found."));
            }

            const result = new SearchResult(res.data, this.classes.get("Track"), user);
            return resolve(result);
        });
    }
}
