// tslint:disable-next-line: no-var-requires
import Axios from "axios";
import { EventEmitter } from "events";
import { Node, INodeOptions } from "./entities/Node";
import { Player } from "./entities/Player";
import { Queue } from "./entities/Queue";
import { SearchResult } from "./entities/SearchResult";
import { Track } from "./entities/Track";
import PlayerStore from "./stores/PlayerStore";
import NodeStore from "./stores/NodeStore";
import { Type } from "./utils/Utils";
import libraries from "./libraries";
import _ from "lodash";

/**
 * The IErelaOptions interface.
 */
export interface IErelaOptions {
    /**
     * Shard count.
     */
    shardCount?: number;
    /**
     * The custom Player class.
     */
    player?: Type<Player>;
    /**
     * The custom Node class.
     */
    node?: Type<Node>;
    /**
     * The custom Track class.
     */
    track?: Type<Track>;
    /**
     * The custom Queue class.
     */
    queue?: Type<Queue>;
    /**
     * The client's user ID.
     */
    userId?: string;
    /**
     * The override library to use.
     */
    library?: string;
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

const defaultOptions: IErelaOptions = {
    shardCount: 1,
    player: Player as any,
    node: Node as any,
    track: Track as any,
    queue: Queue as any,
};

const isInstalled = (name: string) => {
    try {
        require(name);
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * The Erela class.
 * @noInheritDoc
 */
export class ErelaClient extends EventEmitter {
    /**
     * The Discord client.
     */
    public readonly client: any;
    /**
     * The shard count.
     */
    public readonly shardCount: number = 1;
    /**
     * The client user ID.
     */
    public readonly userId!: string;
    /**
     * The custom Node class.
     */
    public readonly node!: Type<Node>;
    /**
     * The custom Player class.
     */
    public readonly player!: Type<Player>;
    /**
     * The custom Queue class.
     */
    public readonly queue!: Type<Queue>;
    /**
     * The custom Track class.
     */
    public readonly track!: Type<Track>;
    /**
     * The PlayerStore collection.
     */
    public readonly players!: PlayerStore;
    /**
     * The NodeStore.
     */
    public readonly nodes!: NodeStore;
    public readonly library: any;
    private readonly voiceState: Map<string, any> = new Map();

    /**
     * Emitted when a player is created.
     * @event ErelaClient#playerCreate
     * @param {Player} player - The created player.
     */

    /**
     * Emitted when a player is destroyed.
     * @event ErelaClient#playerDestroy
     * @param {Player} player - The destroyed player.
     */

    /**
     * Emitted when a player is moved to a new channel.
     * @event ErelaClient#playerMove
     * @param {Player} player - The moved player.
     * @param {any} oldChannel - The old voice channel.
     * @param {any} newChannel - The new voice channel.
     */

    /**
     * Emitted when a track is started.
     * @event ErelaClient#trackStart
     * @param {Player} player - The player that has the track.
     * @param {Track} track - The track that started.
     */

    /**
     * Emitted when a track ends.
     * @event ErelaClient#trackEnd
     * @param {Player} player - The player that has the track.
     * @param {Track} track - The track that ended.
     */

    /**
     * Emitted when a track gets stuck during playback.
     * @event ErelaClient#trackStuck
     * @param {Player} player - The player that has the track.
     * @param {Track} track - The track that ended.
     * @param {*} message - The message for the event.
     */

    /**
     * Emitted when a track errors during playback.
     * @event ErelaClient#trackStuck
     * @param {Player} player - The player that has the track.
     * @param {Track} track - The track that ended.
     * @param {*} message - The message for the event.
     */

    /**
     * Emitted when a queue ends.
     * @event ErelaClient#queueEnd
     * @param {Player} player - The player who's queue has ended.
     */

    /**
     * Emitted when a player voice channel connected is closed.
     * @event ErelaClient#socketClosed
     * @param {Player} player - The player.
     * @param {any} message - The message.
     */

    /**
     * Emitted when a node is created.
     * @event ErelaClient#nodeCreate
     * @param {Node} node - The created node.
     */

    /**
     * Emitted when a node connects.
     * @event ErelaClient#nodeConnect
     * @param {Node} node - The node that connected.
     */

    /**
     * Emitted when a node reconnects.
     * @event ErelaClient#nodeReconnect
     * @param {Node} node - The node that reconnected.
     */

    /**
     * Emitted when a node encounters an error.
     * @event ErelaClient#nodeError
     * @param {Node} node - The node.
     * @param {Error} error - The error.
     */

    /**
     * Emitted when a node disconnects abnormally.
     * @event ErelaClient#nodeDisconnect
     * @param {Node} node - The node.
     * @param {Error} error - The error.
     */

    /**
     * Creates an instance of ErelaClient.
     * @param {*} client - The Discord client.
     * @param {Array<INodeOptions>} nodes - The nodes to use.
     * @param {IErelaOptions} [options=defaultOptions] - Options for the client.
     */
    public constructor(client: any, nodes: INodeOptions[], options?: IErelaOptions) {
        super();

        // @ts-ignore
        if (process._erela_client_defined) { return; }

        let _nodes: INodeOptions[] = [{ host: "localhost", port: 2333, password: "youshallnotpass" }];
        let _options = defaultOptions;
        const isObject = (obj: any) =>  typeof obj !== "undefined" && JSON.stringify(obj)[0] === "{";
        const isClass = (obj: any) => typeof obj !== "undefined" && obj.constructor.toString().includes("class");

        if (_.isObject(client) && _.isArray(nodes) && !_.isUndefined(options)) { // client, nodes, options
            this.client = client;
            _nodes = nodes;
            _options = options as IErelaOptions;
        } else if (_.isArray(client) && isObject(nodes) && _.isUndefined(options)) { // nodes, options
            _nodes = client as unknown as INodeOptions[];
            _options = nodes as unknown as IErelaOptions;
        } else if (_.isObject(client) && _.isArray(nodes) && _.isUndefined(options)) { // client, nodes
            this.client = client;
            _nodes = nodes as unknown as INodeOptions[];
        } else if (_.isObject(client) && isObject(nodes) && _.isUndefined(options)) { // client, options
            this.client = client;
            _options = nodes as unknown as IErelaOptions;
        } else if (_.isArray(client) && _.isUndefined(nodes) && _.isUndefined(options)) { // nodes
            _nodes = client as unknown as INodeOptions[];
        } else if (isClass(client) && _.isUndefined(nodes) && _.isUndefined(options)) { // client
            this.client = client;
        } else if (isObject(client) && _.isUndefined(nodes) && _.isUndefined(options)) { // options
            _options = client as unknown as IErelaOptions;
        }

        this.userId = isClass(this.client) && !_.isNull(this.client.user) ? this.client.user.id : _options.userId;

        if (!this.userId) {
            throw new RangeError("new ErelaClient() No user ID supplied.");
        }

        const found = Object.keys(libraries).find(isInstalled);

        this.library = libraries[_options.library!] ?
            libraries[_options.library!] : found ?
            libraries[found] : undefined;

        this.shardCount = _options.shardCount || 1;
        this.node = _options.node || Node;
        this.player = _options.player || Player;
        this.queue = _options.queue || Queue;
        this.track = _options.track || Track;
        this.players = new PlayerStore(this);
        this.nodes = new NodeStore(this, _nodes);

        if (isClass(client)) {
            client.on(this.library.ws.string, this.updateVoiceState.bind(this));
        }
    }

    /**
     * Sends voice data to the Lavalink server. Only use this when you're using a unsupported library.
     * @param {*} data
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
            if (data.d.user_id !== this.userId) {
                return;
            }
            state.sessionId = data.d.session_id;
            const channel = player.voiceChannel.id || player.voiceChannel;
            if (channel !== data.d.channel_id) {
                const found = !this.library ? data.d.channel_id :
                    this.library.findChannel(this.client, data.d.channel_id);

                const currentChannel = player.voiceChannel.id ? player.voiceChannel : player.voiceChannel;
                const newChannel = player.voiceChannel.id ? found : found.id;
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
     * @param {(string|IQuery)} query - The query to search against.
     * @param {any} user - The user who requested the tracks.
     * @returns {Promise<SearchResult>} - The search result.
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

            const result = new SearchResult(res.data, this.track, user);
            return resolve(result);
        });
    }

    /**
     * Sends data to Discord via WebSocket, only available when using a supported library.
     * @param {*} data
     */
    public sendWS(data: any): void {
        if (!this.client) { return; }

        const guild = this.library.findGuild(this.client, data.d.guild_id);

        if (guild && this.library.isSharded(this.client)) {
            this.library.sendShardWS(guild, data);
        } else if (guild) {
            this.library.sendWS(this.client, data);
        }
    }
}
