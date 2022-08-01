"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manager = void 0;
/* eslint-disable no-async-promise-executor */
const collection_1 = __importDefault(require("@discordjs/collection"));
const events_1 = require("events");
const Utils_1 = require("./Utils");
const REQUIRED_KEYS = ["event", "guildId", "op", "sessionId"];
function check(options) {
    if (!options)
        throw new TypeError("ManagerOptions must not be empty.");
    if (typeof options.send !== "function")
        throw new TypeError('Manager option "send" must be present and a function.');
    if (typeof options.clientId !== "undefined" &&
        !/^\d+$/.test(options.clientId))
        throw new TypeError('Manager option "clientId" must be a non-empty string.');
    if (typeof options.nodes !== "undefined" &&
        !Array.isArray(options.nodes))
        throw new TypeError('Manager option "nodes" must be a array.');
    if (typeof options.shards !== "undefined" &&
        typeof options.shards !== "number")
        throw new TypeError('Manager option "shards" must be a number.');
    if (typeof options.plugins !== "undefined" &&
        !Array.isArray(options.plugins))
        throw new TypeError('Manager option "plugins" must be a Plugin array.');
    if (typeof options.autoPlay !== "undefined" &&
        typeof options.autoPlay !== "boolean")
        throw new TypeError('Manager option "autoPlay" must be a boolean.');
    if (typeof options.trackPartial !== "undefined" &&
        !Array.isArray(options.trackPartial))
        throw new TypeError('Manager option "trackPartial" must be a string array.');
    if (typeof options.clientName !== "undefined" &&
        typeof options.clientName !== "string")
        throw new TypeError('Manager option "clientName" must be a string.');
    if (typeof options.defaultSearchPlatform !== "undefined" &&
        typeof options.defaultSearchPlatform !== "string")
        throw new TypeError('Manager option "defaultSearchPlatform" must be a string.');
}
/**
 * The main hub for interacting with Lavalink and using Erela.JS,
 * @noInheritDoc
 */
class Manager extends events_1.EventEmitter {
    /**
     * Initiates the Manager class.
     * @param options
     */
    constructor(options) {
        super();
        /** The map of players. */
        this.players = new collection_1.default();
        /** The map of nodes. */
        this.nodes = new collection_1.default();
        this.initiated = false;
        check(options);
        Utils_1.Structure.get("Player").init(this);
        Utils_1.Structure.get("Node").init(this);
        Utils_1.TrackUtils.init(this);
        if (options.trackPartial) {
            Utils_1.TrackUtils.setTrackPartial(options.trackPartial);
            delete options.trackPartial;
        }
        this.options = Object.assign({ plugins: [], nodes: [{ identifier: "default", host: "localhost" }], shards: 1, autoPlay: true, clientName: "erela.js", defaultSearchPlatform: "youtube" }, options);
        if (this.options.plugins) {
            for (const [index, plugin] of this.options.plugins.entries()) {
                if (!(plugin instanceof Utils_1.Plugin))
                    throw new RangeError(`Plugin at index ${index} does not extend Plugin.`);
                plugin.load(this);
            }
        }
        if (this.options.nodes) {
            for (const nodeOptions of this.options.nodes)
                new (Utils_1.Structure.get("Node"))(nodeOptions);
        }
    }
    /** Returns the least used Nodes. */
    get leastUsedNodes() {
        return this.nodes
            .filter((node) => node.connected)
            .sort((a, b) => b.calls - a.calls);
    }
    /** Returns the least system load Nodes. */
    get leastLoadNodes() {
        return this.nodes
            .filter((node) => node.connected)
            .sort((a, b) => {
            const aload = a.stats.cpu
                ? (a.stats.cpu.systemLoad / a.stats.cpu.cores) * 100
                : 0;
            const bload = b.stats.cpu
                ? (b.stats.cpu.systemLoad / b.stats.cpu.cores) * 100
                : 0;
            return aload - bload;
        });
    }
    /**
     * Initiates the Manager.
     * @param clientId
     */
    init(clientId) {
        if (this.initiated)
            return this;
        if (typeof clientId !== "undefined")
            this.options.clientId = clientId;
        if (typeof this.options.clientId !== "string")
            throw new Error('"clientId" set is not type of "string"');
        if (!this.options.clientId)
            throw new Error('"clientId" is not set. Pass it in Manager#init() or as a option in the constructor.');
        for (const node of this.nodes.values()) {
            try {
                node.connect();
            }
            catch (err) {
                this.emit("nodeError", node, err);
            }
        }
        this.initiated = true;
        return this;
    }
    /**
     * Searches the enabled sources based off the URL or the `source` property.
     * @param query
     * @param requester
     * @returns The search result.
     */
    search(query, requester) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const node = this.leastUsedNodes.first();
            if (!node)
                throw new Error("No available nodes.");
            const _query = typeof query === "string" ? { query } : query;
            const _source = (_b = Manager.DEFAULT_SOURCES[(_a = _query.source) !== null && _a !== void 0 ? _a : this.options.defaultSearchPlatform]) !== null && _b !== void 0 ? _b : _query.source;
            let search = _query.query;
            if (!/^https?:\/\//.test(search)) {
                search = `${_source}:${search}`;
            }
            const res = yield node
                .makeRequest(`/loadtracks?identifier=${encodeURIComponent(search)}`)
                .catch(err => reject(err));
            if (!res) {
                return reject(new Error("Query not found."));
            }
            const result = {
                loadType: res.loadType,
                exception: (_c = res.exception) !== null && _c !== void 0 ? _c : null,
                tracks: res.tracks.map((track) => Utils_1.TrackUtils.build(track, requester)),
            };
            if (result.loadType === "PLAYLIST_LOADED") {
                result.playlist = {
                    name: res.playlistInfo.name,
                    selectedTrack: res.playlistInfo.selectedTrack === -1 ? null :
                        Utils_1.TrackUtils.build(res.tracks[res.playlistInfo.selectedTrack], requester),
                    duration: result.tracks
                        .reduce((acc, cur) => acc + (cur.duration || 0), 0),
                };
            }
            return resolve(result);
        }));
    }
    /**
     * Decodes the base64 encoded tracks and returns a TrackData array.
     * @param tracks
     */
    decodeTracks(tracks) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const node = this.nodes.first();
            if (!node)
                throw new Error("No available nodes.");
            const res = yield node.makeRequest(`/decodetracks`, r => {
                r.method = "POST";
                r.body = JSON.stringify(tracks);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                r.headers["Content-Type"] = "application/json";
            })
                .catch(err => reject(err));
            if (!res) {
                return reject(new Error("No data returned from query."));
            }
            return resolve(res);
        }));
    }
    /**
     * Decodes the base64 encoded track and returns a TrackData.
     * @param track
     */
    decodeTrack(track) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.decodeTracks([track]);
            return res[0];
        });
    }
    /**
     * Creates a player or returns one if it already exists.
     * @param options
     */
    create(options) {
        if (this.players.has(options.guild)) {
            return this.players.get(options.guild);
        }
        return new (Utils_1.Structure.get("Player"))(options);
    }
    /**
     * Returns a player or undefined if it does not exist.
     * @param guild
     */
    get(guild) {
        return this.players.get(guild);
    }
    /**
     * Destroys a player if it exists.
     * @param guild
     */
    destroy(guild) {
        this.players.delete(guild);
    }
    /**
     * Creates a node or returns one if it already exists.
     * @param options
     */
    createNode(options) {
        if (this.nodes.has(options.identifier || options.host)) {
            return this.nodes.get(options.identifier || options.host);
        }
        return new (Utils_1.Structure.get("Node"))(options);
    }
    /**
     * Destroys a node if it exists.
     * @param identifier
     */
    destroyNode(identifier) {
        const node = this.nodes.get(identifier);
        if (!node)
            return;
        node.destroy();
        this.nodes.delete(identifier);
    }
    /**
     * Sends voice data to the Lavalink server.
     * @param data
     */
    updateVoiceState(data) {
        if ("t" in data && !["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"].includes(data.t))
            return;
        const update = "d" in data ? data.d : data;
        if (!update || !("token" in update) && !("session_id" in update))
            return;
        const player = this.players.get(update.guild_id);
        if (!player)
            return;
        if ("token" in update) {
            /* voice server update */
            player.voiceState.event = update;
        }
        else {
            /* voice state update */
            if (update.user_id !== this.options.clientId) {
                return;
            }
            if (update.channel_id) {
                if (player.voiceChannel !== update.channel_id) {
                    /* we moved voice channels. */
                    this.emit("playerMove", player, player.voiceChannel, update.channel_id);
                }
                player.voiceState.sessionId = update.session_id;
                player.voiceChannel = update.channel_id;
            }
            else {
                /* player got disconnected. */
                this.emit("playerDisconnect", player, player.voiceChannel);
                player.voiceChannel = null;
                player.voiceState = Object.assign({});
                player.pause(true);
            }
        }
        if (REQUIRED_KEYS.every(key => key in player.voiceState)) {
            player.node.send(player.voiceState);
        }
    }
}
exports.Manager = Manager;
Manager.DEFAULT_SOURCES = {
    "youtube music": "ytmsearch",
    "youtube": "ytsearch",
    "soundcloud": "scsearch"
};
