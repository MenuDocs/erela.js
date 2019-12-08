import Axios from "axios";
import { Guild, TextChannel, User, VoiceChannel } from "discord.js";
import { EventEmitter } from "events";
import { INode, Node } from "./structures/Node";
import { IPlayer, Player } from "./structures/Player";
import { IQueue, Queue } from "./structures/Queue";
import { SearchResult } from "./entities/SearchResult";
import { ITrack, Track } from "./structures/Track";
import PlayerStore from "./stores/PlayerStore";
import NodeStore from "./stores/NodeStore";

/**
 * The INodeOptions interface.
 * @export
 * @interface INodeOptions
 */
export interface INodeOptions {
    host: string;
    port: number;
    password: string;
    retryAmount?: number;
    retryDelay?: number;
}

/**
 * The IErelaOptions interface.
 * @export
 * @interface IErelaOptions
 */
export interface IErelaOptions {
    shardCount?: number;
    player?: IPlayer;
    node?: INode;
    track?: ITrack;
    queue?: IQueue;
}

/**
 * The IPlayerOptions interface.
 * @export
 * @interface IPlayerOptions
 */
export interface IPlayerOptions {
    guild: Guild;
    textChannel: TextChannel;
    voiceChannel: VoiceChannel;
    selfDeaf?: boolean;
    selfMute?: boolean;
}

const defaultOptions: IErelaOptions = {
    shardCount: 1,
    player: Player as any,
    node: Node as any,
    track: Track as any,
    queue: Queue as any,
};

/**
 * The ISearchQuery interface.
 * @export
 * @interface ISearchQuery
 */
export interface ISearchQuery {
    query: string;
    source?: string;
}

/**
 * The Discord packet.
 * @interface IPacket
 */
interface IPacket {
    op: number;
    d: any;
    s?: number;
    t?: string;
}

/**
 * The Erela class.
 * @export
 * @class Erela
 * @extends {EventEmitter}
 */
export class ErelaClient extends EventEmitter {
    public readonly client: any;
    public readonly shardCount: number = 1;
    public readonly userId: string;
    public readonly node: any;
    public readonly player: any;
    public readonly queue: any;
    public readonly track: any;
    public readonly players: PlayerStore;
    public readonly nodes: NodeStore;
    private voiceState: any = {};
    private readonly httpRegex: RegExp = /^https?:\/\//;

    /**
     * Creates an instance of ErelaClient.
     * @param {*} client
     * @param {NodeOptions[]} nodes - The nodes to use.
     * @param {ErelaOptions} [options=defaultOptions] - Options for the client.
     * @memberof ErelaClient
     */
    public constructor(client: any, nodes: INodeOptions[], options?: IErelaOptions) {
        super();

        let _nodes: any = [];
        let _options = defaultOptions;

        if (Array.isArray(nodes) && !options) {
            _nodes = nodes;
        } else if (nodes && !Array.isArray(nodes) && !options) {
            _options = nodes as IErelaOptions;
        } else if (Array.isArray(nodes) && options) {
            _nodes = nodes;
            _options = options;
        }

        this.client = client;
        this.userId = client.user.id;
        this.shardCount = _options.shardCount || 1;
        this.node = (_options.node || Node) as any;
        this.player = (_options.player || Player) as any;
        this.queue = (_options.queue || Queue) as any;
        this.track = (_options.track || Track) as any;
        this.players = new PlayerStore(this);
        this.nodes = new NodeStore(this, _nodes);
        client.on("raw", this.updateVoiceState.bind(this));
    }

    /**
     * Updates the players voice state.
     * @param {Packet} data - The packet sent by Discord.
     * @returns {void}
     * @memberof Erela
     */
    public updateVoiceState(data: IPacket): void  {
        if (!data || !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(data.t || "")) {
            return;
        }
        const player = this.players.get(data.d.guild_id);

        if (!player) {
            return;
        }

        if (data.t === "VOICE_SERVER_UPDATE") {
            this.voiceState.op = "voiceUpdate";
            this.voiceState.guildId = data.d.guild_id;
            this.voiceState.event = data.d;
        } else {
            if (data.d.user_id !== this.userId) {
                return;
            }
            this.voiceState.sessionId = data.d.session_id;
            if (player && data.d.channel_id) {
                const newChannel = this.client.channels.get(data.d.channel_id);
                if (player.voiceChannel.id !== newChannel.id) {
                    this.emit("playerMove", player, player.voiceChannel, newChannel);
                }
                player.voiceChannel = newChannel;
            }
        }

        if (JSON.stringify(Object.keys(this.voiceState).sort()) === JSON.stringify(["op", "guildId", "sessionId", "event"].sort())) {
            player.node.send(this.voiceState);
            this.voiceState = {};
        }
    }

    /**
     * Searches YouTube with the query. Note: As of writing this only youtube worked.
     * @param {string} query - The query to search against.
     * @param {User} user - The user who requested the tracks.
     * @returns {Promise<SearchResult>}
     * @memberof Erela
     */
    public search(query: string, user: User): Promise<SearchResult> {
        return new Promise(async (resolve, reject) => {
            const node: INode = this.nodes.leastUsed.first();

            if (!node) {
                throw new Error("ErelaClient#search() No available nodes.");
            }

            if (!this.httpRegex.test(query)) {
                query = `ytsearch:${query}`;
            }
            const url = `http://${node.options.host}:${node.options.port}/loadtracks`;

            const res = await Axios.get(url, {
                headers: { Authorization: node.options.password },
                params: { identifier: query },
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
     * Sends a packet to Discord's API.
     * @param {Packet} data - The data to send.
     * @memberof Erela
     */
    public sendWS(data: IPacket): void {
        const guild = this.client.guilds.get(data.d.guild_id);
        if (guild) { this.client.ws.shards ? guild.shard.send(data) : this.client.ws.send(data); }
    }
}
