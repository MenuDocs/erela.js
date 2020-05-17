// tslint:disable: member-ordering
import { Track, Player } from "./Player";
import { Structure } from "./Utils";
import { Manager } from "./Manager";
import WebSocket from "ws";

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
    /** The socket for the node. */
    public socket: WebSocket | null;
    /** The amount of rest calls the node has made. */
    public calls = 0;
    /** The stats for the node. */
    public stats: any;
    private reconnectTimeout?: NodeJS.Timeout;
    private reconnectAttempts: number = 0;

    /** Returns if connected to the Node. */
    public get connected(): boolean {
        if (!this.socket) return false;
        return this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * Creates an instance of Node.
     * @param {Manager} manager The Manager.
     * @param {NodeOptions} options The NodeOptions to pass.
     */
    constructor(public manager: Manager, public options: NodeOptions ) {
        super();
    }

    /** Connects to the Node. */
    public connect(): void {
        if (this.connected) return;

        const headers = {
            "Authorization": this.options.password,
            "Num-Shards": String(this.manager.options.shards),
            "User-Id": this.manager.options.clientId,
        };

        this.socket = new WebSocket(`ws://${this.options.host}:${this.options.port}/`, { headers });
        this.socket.on("open", this.open.bind(this));
        this.socket.on("close", this.close.bind(this));
        this.socket.on("message", this.message.bind(this));
        this.socket.on("error", this.error.bind(this));
    }

    /**
     * Reconnects to the Node.
     */
    public reconnect(): void {
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.options.retryAmount) {
                this.manager.emit("nodeError", this, new Error(`Unable to connect after ${this.options.retryAmount}`));
                clearTimeout(this.reconnectTimeout);
                this.destroy();
                return;
            }
            this.socket.removeAllListeners();
            this.socket = null;
            this.manager.emit("nodeReconnect", this);
            this.connect();
            this.reconnectAttempts++;
        }, this.options.retryDelay);
    }

    /** Destroys the Node. */
    public destroy(): void {
        if (!this.connected) return;
        this.socket.close(1000, "destroy");
        this.socket.removeAllListeners();
        this.socket = null;
    }

    /**
     * Sends data to the Node.
     * @param {any} data The data to send.
     */
    public send(data: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.connected) return resolve(false);
            if (!data || !JSON.stringify(data).startsWith("{")) { return reject(false); }
            this.socket.send(JSON.stringify(data), (error: any) => {
                if (error) reject(error);
                else resolve(true);
            });
        });
    }

    protected open(): void {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.manager.emit("nodeConnect", this);
    }

    protected close(code: number, reason: string): void {
        this.manager.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy") this.reconnect();
    }

    protected message(d: Buffer|string): void {
        if (Array.isArray(d)) d = Buffer.concat(d);
        else if (d instanceof ArrayBuffer) d = Buffer.from(d);

        const payload = JSON.parse(d.toString());
        if (!payload.op) return;

        switch (payload.op) {
            case "stats":
                delete payload.op;
                this.stats = { ...payload };
                break;
            case "playerUpdate":
                const player = this.manager.players.get(payload.guildId);
                if (player) player.position = payload.state.position || 0;
                break;
            case "event":
                this.handleEvent(payload);
                break;
            default:
                this.manager.emit("nodeError", this, new Error(`Unexpected op "${payload.op}" with data ${payload}`));
                return;
        }
    }

    protected error(error: Error): void {
        if (!error) return;
        this.manager.emit("nodeError", this, error);
        this.reconnect();
    }

    protected handleEvent(payload: any): void {
        if (!payload.guildId) { return; }
        const player = this.manager.players.get(payload.guildId);
        if (!player) return;
        const track = player.queue[0];
        switch (payload.type) {
            case "TrackStartEvent":
                this.trackStart(player, track, payload);
                break;
            case "TrackEndEvent":
                this.trackEnd(player, track, payload);
                break;
            case "TrackStuckEvent":
                this.trackStuck(player, track, payload);
                break;
            case "TrackExceptionEvent":
                this.trackError(player, track, payload);
                break;
            case "WebSocketClosedEvent":
                this.socketClosed(player, payload);
                break;
            default:
                this.manager.emit("nodeError", this, new Error(`Node#event Unknown event '${payload.type}'.`));
        }
    }

    protected trackEnd(player: Player, track: Track, payload: any): void {
        if (track && player.trackRepeat) {
            this.manager.emit("trackEnd", player, track);
            if (this.manager.options.autoPlay) player.play();
        } else if (track && player.queueRepeat) {
            player.queue.add(player.queue.shift());
            this.manager.emit("trackEnd", player, track);
            if (this.manager.options.autoPlay) player.play();
        } else if (player.queue.length === 1) {
            player.queue.shift();
            player.playing = false;
            if (["REPLACED", "FINISHED", "STOPPED"].includes(payload.reason)) {
                this.manager.emit("queueEnd", player);
            }
        } else if (player.queue.length > 0) {
            player.queue.shift();
            this.manager.emit("trackEnd", player, track);
            if (this.manager.options.autoPlay) player.play();
        }
    }

    protected trackStart(player: Player, track: Track, payload: any): void {
        player.playing = true;
        this.manager.emit("trackStart", player, track, payload);
    }

    protected trackStuck(player: Player, track: Track, payload: any): void {
        player.queue.shift();
        this.manager.emit("trackStuck", player, track, payload);
    }

    protected trackError(player: Player, track: Track, payload: any): void {
        player.queue.shift();
        this.manager.emit("trackError", player, track, payload);
    }

    protected socketClosed(player: Player, payload: any): void {
        this.manager.emit("socketClosed", player, payload);
    }
}
