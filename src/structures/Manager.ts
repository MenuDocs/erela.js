/* eslint-disable no-async-promise-executor, @typescript-eslint/no-explicit-any */
import { LoadType, buildTrack, Plugin, Structure } from "./Utils";
import { Node, NodeOptions } from "./Node";
import { EventEmitter } from "events";
import { Player, Track } from "./Player";
import Collection from "@discordjs/collection";
import Axios from "axios";

/** The ManagerOptions interface. */
export interface ManagerOptions {
    /** The array of nodes to connect to. */
    nodes?: NodeOptions[];
    /** The client ID to use. */
    clientId?: string;
    /** The shard count. */
    shards?: number;
    /** A array of plugins to use. */
    plugins?: Plugin[];
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
export interface Query {
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
            selectedTrack?: Track;
        };
        /** The tracks in the playlist. */
        tracks: Track[];
        /** The duration of the playlist. */
        length: number;
    };
    /** The exception when searching if one. */
    exception?: {
        /** The message for the exception. */
        message: string;
        /** The severity of exception. */
        severity: string;
    };
}

const template = JSON.stringify(["event", "guildId", "op", "sessionId"]);

/** The Manager class. */
export class Manager extends EventEmitter {
    /** The map of players. */
    public readonly players: Collection<string, Player> = new Collection<string, Player>();
    /** The map of nodes. */
    public readonly nodes = new Collection<string, Node>();
    /** The options that were set. */
    public readonly options: ManagerOptions;
    protected readonly voiceStates: Map<string, any> = new Map();

    /**
     * Creates the Manager class.
     * @param {ManagerOptions} [options] The options to use.
     */
    constructor(options?: ManagerOptions) {
        super();

        if (!options.send) throw new RangeError("Missing send method in ManageOptions.");

        this.options = {
            plugins: [],
            nodes: [{
                host: "localhost",
                port: 2333,
                password: "youshallnotpass",
            }],
            shards: 1,
            autoPlay: false,
            ...options,
        };

        this.options.plugins.forEach((plugin) => plugin.load(this));

        this.options.nodes.forEach((node: NodeOptions) => {
            const identifier = node.identifier || node.host;
            this.nodes.set(identifier, new (Structure.get("Node"))(this, node));
        });
    }

    /**
     * Initiates the manager (with a client ID if none provided in ManagerOptions).
     * @param {string} clientId The client ID to use.
     */
    public init(clientId?: string): this {
        if (clientId) this.options.clientId = clientId;
        if (!this.options.clientId) {
            throw new Error("\"clientId\" is not set. Pass it in Manager#init() or as a option in the constructor.");
        }

        this.nodes.forEach((node: Node) => node.connect());
        Structure.get("Player").init(this);
        return this;
    }

    /**
     * Searches YouTube with the query.
     * @param {(string|Query)} query The query to search against.
     * @param {any} requester The user who requested the tracks.
     * @returns {Promise<SearchResult>} The search result.
     */
    public search(query: string | Query, requester: any): Promise<SearchResult> {
        return new Promise(async (resolve, reject) => {
            const node: Node = this.nodes.values().next().value;

            if (!node) {
                throw new Error("Manager#search() No available nodes.");
            }

            const source = { soundcloud: "sc" }[(query as Query).source] || "yt";
            let search = (query as Query).query || query as string;

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

            if (!res || !res.data) {
                return reject(new Error("No data returned from query."));
            }

            const result: SearchResult = {
                loadType: res.data.loadType,
                exception: res.data.exception,
            };

            if ([LoadType.SEARCH_RESULT, LoadType.TRACK_LOADED].includes(LoadType[result.loadType])) {
                result.tracks = res.data.tracks.map((track) => buildTrack(track, requester));
            } else if (result.loadType === LoadType.PLAYLIST_LOADED) {
                result.playlist = {
                    tracks: res.data.tracks.map((track) => buildTrack(track, requester)),
                    info: {
                        name: res.data.playlist.info.name,
                        selectedTrack: buildTrack(res.data.playlist.info.selectedTrack, requester),
                    },
                    length: res.data.tracks
                        .map((track: any) => track.info.length)
                        .reduce((acc: number, cur: number) => acc + cur, 0),
                };
            }

            return resolve(result);
        });
    }

    /**
     * Sends voice data to the Lavalink server.
     * @param {*} data The data to send.
     */
    public updateVoiceState(data: any): void {
        if (!data || !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(data.t || "")) return;
        const player = this.players.get(data.d.guild_id) as Player;

        if (!player) return;
        const state = this.voiceStates.get(data.d.guild_id) || {};

        if (data.t === "VOICE_SERVER_UPDATE") {
            state.op = "voiceUpdate";
            state.guildId = data.d.guild_id;
            state.event = data.d;
        } else {
            if (data.d.user_id !== this.options.clientId) return;
            state.sessionId = data.d.session_id;
            if (player.options.voiceChannel !== data.d.channel_id) {
                this.emit("playerMove", player, player.voiceChannel, data.d.channel_id);
            }
        }

        this.voiceStates.set(data.d.guild_id, state);
        if (JSON.stringify(Object.keys(state).sort()) === template) {
            player.node.send(state);
            this.voiceStates.delete(data.d.guild_id);
        }
    }
}
