"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
/* eslint-disable no-case-declarations */
const ws_1 = __importDefault(require("ws"));
class Node {
    /**
     * Creates an instance of Node.
     * @param manager
     * @param options
     */
    constructor(manager, options) {
        this.manager = manager;
        this.options = options;
        /** The socket for the node. */
        this.socket = null;
        /** The amount of rest calls the node has made. */
        this.calls = 0;
        this.reconnectAttempts = 1;
        this.options = Object.assign({ port: 2333, password: "youshallnotpass", secure: false, retryAmount: 5, retryDelay: 30e3 }, options);
        this.options.identifier = options.identifier || options.host;
        this.stats = {
            players: 0,
            playingPlayers: 0,
            uptime: 0,
            memory: {
                free: 0,
                used: 0,
                allocated: 0,
                reservable: 0,
            },
            cpu: {
                cores: 0,
                systemLoad: 0,
                lavalinkLoad: 0,
            },
            frameStats: {
                sent: 0,
                nulled: 0,
                deficit: 0,
            },
        };
        this.manager.emit("nodeCreate", this);
    }
    /** Returns if connected to the Node. */
    get connected() {
        if (!this.socket)
            return false;
        return this.socket.readyState === ws_1.default.OPEN;
    }
    /** Connects to the Node. */
    connect() {
        if (this.connected)
            return;
        const headers = {
            Authorization: this.options.password,
            "Num-Shards": String(this.manager.options.shards),
            "User-Id": this.manager.options.clientId,
        };
        this.socket = new ws_1.default(`ws${this.options.secure ? "s" : ""}://${this.options.host}:${this.options.port}/`, { headers });
        this.socket.on("open", this.open.bind(this));
        this.socket.on("close", this.close.bind(this));
        this.socket.on("message", this.message.bind(this));
        this.socket.on("error", this.error.bind(this));
    }
    /** Destroys the Node. */
    destroy() {
        if (!this.connected)
            return;
        this.socket.close(1000, "destroy");
        this.socket.removeAllListeners();
        this.socket = null;
        this.reconnectAttempts = 1;
        this.manager.emit("nodeDestroy", this);
        return clearTimeout(this.reconnectTimeout);
    }
    /**
     * Sends data to the Node.
     * @param data
     */
    send(data) {
        return new Promise((resolve, reject) => {
            if (!this.connected)
                return resolve(false);
            if (!data || !JSON.stringify(data).startsWith("{")) {
                return reject(false);
            }
            this.socket.send(JSON.stringify(data), (error) => {
                if (error)
                    reject(error);
                else
                    resolve(true);
            });
        });
    }
    reconnect() {
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.options.retryAmount) {
                this.manager.emit("nodeError", this, new Error(`Unable to connect after ${this.options.retryAmount} attempts.`));
                return this.destroy();
            }
            this.socket.removeAllListeners();
            this.socket = null;
            this.manager.emit("nodeReconnect", this);
            this.connect();
            this.reconnectAttempts++;
        }, this.options.retryDelay);
    }
    open() {
        if (this.reconnectTimeout)
            clearTimeout(this.reconnectTimeout);
        this.manager.emit("nodeConnect", this);
    }
    close(code, reason) {
        this.manager.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy")
            this.reconnect();
    }
    error(error) {
        if (!error)
            return;
        this.manager.emit("nodeError", this, error);
    }
    message(d) {
        if (Array.isArray(d))
            d = Buffer.concat(d);
        else if (d instanceof ArrayBuffer)
            d = Buffer.from(d);
        const payload = JSON.parse(d.toString());
        if (!payload.op)
            return;
        this.manager.emit("nodeRaw", payload);
        switch (payload.op) {
            case "stats":
                delete payload.op;
                this.stats = Object.assign({}, payload);
                break;
            case "playerUpdate":
                const player = this.manager.players.get(payload.guildId);
                if (player)
                    player.position = payload.state.position || 0;
                break;
            case "event":
                this.handleEvent(payload);
                break;
            default:
                this.manager.emit("nodeError", this, new Error(`Unexpected op "${payload.op}" with data ${payload}`));
                return;
        }
    }
    handleEvent(payload) {
        if (!payload.guildId) {
            return;
        }
        const player = this.manager.players.get(payload.guildId);
        if (!player)
            return;
        const track = player.queue.current;
        const type = payload.type;
        if (payload.type === "TrackStartEvent") {
            this.trackStart(player, track, payload);
        }
        else if (payload.type === "TrackEndEvent") {
            this.trackEnd(player, track, payload);
        }
        else if (payload.type === "TrackStuckEvent") {
            this.trackStuck(player, track, payload);
        }
        else if (payload.type === "TrackExceptionEvent") {
            this.trackError(player, track, payload);
        }
        else if (payload.type === "WebSocketClosedEvent") {
            this.socketClosed(player, payload);
        }
        else {
            this.manager.emit("nodeError", this, new Error(`Node#event Unknown event '${type}'.`));
        }
    }
    trackStart(player, track, payload) {
        player.playing = true;
        player.paused = false;
        this.manager.emit("trackStart", player, track, payload);
    }
    trackEnd(player, track, payload) {
        if (payload.reason === "REPLACED") {
            this.manager.emit("trackEnd", player, track, payload);
        }
        else if (track && player.trackRepeat) {
            this.manager.emit("trackEnd", player, track, payload);
            if (this.manager.options.autoPlay)
                player.play();
        }
        else if (track && player.queueRepeat) {
            player.queue.add(track);
            player.queue.current = player.queue.shift();
            this.manager.emit("trackEnd", player, track, payload);
            if (this.manager.options.autoPlay)
                player.play();
        }
        else if (!player.queue.length) {
            player.queue.current = null;
            player.playing = false;
            this.manager.emit("trackEnd", player, track, payload);
            if (payload.reason === "FINISHED") {
                this.manager.emit("queueEnd", player);
            }
        }
        else if (player.queue.length) {
            player.queue.current = player.queue.shift();
            this.manager.emit("trackEnd", player, track, payload);
            if (this.manager.options.autoPlay)
                player.play();
        }
    }
    trackStuck(player, track, payload) {
        player.stop();
        this.manager.emit("trackStuck", player, track, payload);
    }
    trackError(player, track, payload) {
        player.stop();
        this.manager.emit("trackError", player, track, payload);
    }
    socketClosed(player, payload) {
        this.manager.emit("socketClosed", player, payload);
    }
}
exports.Node = Node;
