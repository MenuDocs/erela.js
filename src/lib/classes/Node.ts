// tslint:disable: member-ordering
import { ErelaClient } from "../ErelaClient";
import { Player } from "./Player";
import { Track } from "./Track";
import WebSocket from "ws";

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

const defaultOptions: Partial<INodeOptions> = {
    retryAmount: 5,
    retryDelay: 30e3,
};

/**
 * The Node class.
 */
export class Node {
    /**
     * The options for the new.
     */
    public options: INodeOptions;
    /**
     * The stats for the node.
     */
    public stats: INodeStats;
    /**
     * The amount of REST calls the node has made.
     */
    public calls: number = 0;
    private reconnectTimeout?: NodeJS.Timeout;
    private reconnectAttempts: number = 0;
    private websocket: WebSocket|null = null;

    /**
     * Returns if connected to the Node.
     */
    public get connected(): boolean {
        if (!this.websocket) { return false; }
        return this.websocket.readyState === WebSocket.OPEN;
    }

    /**
     * Creates an instance of Node and connects after being created.
     * @param {ErelaClient} erela The Erela client.
     * @param {INodeOptions} options The Node options.
     */
    public constructor(public readonly erela: ErelaClient, options: INodeOptions) {
        this.options = { ...defaultOptions, ...options };
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
        };
        this.connect();
    }

    /**
     * Changes the node options and reconnects.
     * @param {INodeOptions} options The new Nodes options.
     */
    public setOptions(options: INodeOptions): void {
        if (!options || !options.host || !options.port || !options.password) {
            throw new RangeError("Player#setOption(options: INodeOptions) Options must be of type INodeOptions.");
        }
        this.options = { ...defaultOptions, ...options };
        this.connect();
    }

    /**
     * Connects to the Node.
     */
    public connect(): void {
        if (this.connected) {
            throw new Error("Player#connect() Already connected to the WebSocket.");
        }

        const headers = {
            "Authorization": this.options.password,
            "Num-Shards": String(this.erela.options.shardCount),
            "User-Id": this.erela.options.userId,
        };

        this.websocket = new WebSocket(`ws://${this.options.host}:${this.options.port}/`, { headers });
        this.websocket.on("open", this.open.bind(this));
        this.websocket.on("close", this.close.bind(this));
        this.websocket.on("message", this.message.bind(this));
        this.websocket.on("error", this.error.bind(this));
    }

    /**
     * Reconnects to the Node.
     */
    public reconnect(): void {
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.options.retryAmount) {
                this.erela.emit("nodeError", this, new Error(`Unable to connect after ${this.options.retryAmount}`));
                clearTimeout(this.reconnectTimeout);
                this.destroy();
                return;
            }
            this.websocket.removeAllListeners();
            this.websocket = null;
            this.erela.emit("nodeReconnect", this);
            this.connect();
            this.reconnectAttempts++;
        }, this.options.retryDelay);
    }

    /**
     * Destroys the Node.
     */
    public destroy(): void {
        if (!this.connected) { return; }
        this.websocket.close(1000, "destroy");
        this.websocket.removeAllListeners();
        this.websocket = null;
    }

    /**
     * Sends data to the Node.
     * @param {any} data The data to send.
     */
    public send(data: any): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.connected) { return resolve(false); }
            if (!data || !JSON.stringify(data).startsWith("{")) { return reject(false); }
            this.websocket.send(JSON.stringify(data), (error: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(true);
                }
            });
        });
    }

    private open(): void {
        if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); }
        this.erela.emit("nodeConnect", this);
    }

    private close(code: number, reason: string): void {
        this.erela.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy") { this.reconnect(); }
    }

    private message(d: Buffer|string): void {
        if (Array.isArray(d)) {
            d = Buffer.concat(d);
        } else if (d instanceof ArrayBuffer) {
            d = Buffer.from(d);
        }

        const payload = JSON.parse(d.toString());
        if (!payload.op) { return; }

        switch (payload.op) {
            case "stats":
                delete payload.op;
                this.stats = { ...payload };
                break;
            case "playerUpdate":
                const player = this.erela.players.get(payload.guildId);
                if (player) {
                    player.position = payload.state.position || 0;
                }
                break;
            case "event":
                this.handleEvent(payload);
                break;
            default:
                this.erela.emit("nodeError", this, new Error(`Unexpected op "${payload.op}" with data ${payload}`));
                return;
        }
    }

    private error(error: Error): void {
        if (!error) { return; }
        this.erela.emit("nodeError", this, error);
        this.reconnect();
    }

    private handleEvent(payload: any): void {
        if (!payload.guildId) { return; }
        const player = this.erela.players.get(payload.guildId);
        if (!player) { return; }
        const track = player.queue[0];
        switch (payload.type) {
            case "TrackStartEvent":
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
                this.erela.emit("nodeError", this, new Error(`Node#event Unknown event '${payload.type}'.`));
        }
    }

    protected trackEnd(player: Player, track: Track, payload: any): void {
        if (track && player.trackRepeat) {
            this.erela.emit("trackEnd", player, track);
            if (this.erela.options.autoPlay) { player.play(); }
        } else if (track && player.queueRepeat) {
            player.queue.add(player.queue.shift());
            this.erela.emit("trackEnd", player, track);
            if (this.erela.options.autoPlay) { player.play(); }
        } else if (player.queue.size === 1) {
            player.queue.shift();
            player.playing = false;
            if (["REPLACED", "FINISHED", "STOPPED"].includes(payload.reason)) {
                this.erela.emit("queueEnd", player);
            }
        } else if (player.queue.size > 0) {
            player.queue.shift();
            this.erela.emit("trackEnd", player, track);
            if (this.erela.options.autoPlay) { player.play(); }
        }
    }

    protected trackStuck(player: Player, track: Track, payload: any): void {
        player.queue.shift();
        this.erela.emit("trackStuck", player, track, payload);
    }

    protected trackError(player: Player, track: Track, payload: any): void {
        player.queue.shift();
        this.erela.emit("trackError", player, track, payload);
    }

    protected socketClosed(player: Player, payload: any): void {
        this.erela.emit("socketClosed", player, payload);
    }
 }
