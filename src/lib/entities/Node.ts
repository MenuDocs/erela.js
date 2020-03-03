import WebSocket from "ws";
import { ErelaClient } from "../ErelaClient";

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
interface INodeMemoryStats {
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
 * @interface INodeCPUStats
 */
interface INodeCPUStats {
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
interface INodeFrameStats {
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
interface INodeStats {
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
    /**
     * The options for the new.
     */
    public options: INodeOptions;
    public websocket: WebSocket|null = null;
    /**
     * The stats for the node.
     */
    public stats: INodeStats;
    public reconnectTimeout: NodeJS.Timeout | undefined;
    /**
     * The amount the node will try to reconnect.
     */
    public reconnectAttempts: number = 0;
    /**
     * The amount the node will try to reconnect.
     */
    public retryAmount: number;
    /**
     * The amount the node will delay after a failed reconnect.
     */
    public retryDelay: number;
    /**
     * The amount of REST calls the node has made.
     */
    public calls: number = 0;

    /**
     * Returns if connected to the Node.
     */
    public get connected(): boolean {
        if (!this.websocket) { return false; }
        return this.websocket.readyState === WebSocket.OPEN;
    }

    /**
     * Creates an instance of Node and connects after being created.
     * @param {ErelaClient} erela - The Erela client.
     * @param {INodeOptions} options - The Node options.
     */
    public constructor(public readonly erela: ErelaClient, options: INodeOptions) {
        this.options = options;
        this.retryAmount = this.options.retryAmount || 5;
        this.retryDelay = this.options.retryDelay || 30e3;
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
     * @param {INodeOptions} options - The new Nodes options.
     */
    public setOptions(options: INodeOptions): void {
        if (!options || !options.host || !options.port || !options.password) {
            throw new RangeError("Player#setOption(options: INodeOptions) Options must be of type INodeOptions.");
        }
        this.options = options;
        this.retryAmount = options.retryAmount || this.retryAmount;
        this.retryDelay = options.retryDelay || this.retryDelay;
        this.connect();
    }

    /**
     * Connects to the Node.
     */
    public connect(): void {
        const headers = {
            "Authorization": this.options.password,
            "Num-Shards": String(this.erela.shardCount),
            "User-Id": this.erela.userId,
        };

        this.websocket = new WebSocket(`ws://${this.options.host}:${this.options.port}/`, { headers });

        this.websocket.on("open", this._onOpen.bind(this));
        this.websocket.on("close", this._onClose.bind(this));
        this.websocket.on("message", this._onMessage.bind(this));
        this.websocket.on("error", this._onError.bind(this));
    }

    /**
     * Reconnects to the Node.
     */
    public reconnect(): void {
        this.reconnectTimeout = setTimeout(() => {
            if (this.reconnectAttempts >= this.retryAmount) {
                this.erela.emit("nodeError", this, new Error(`Unable to connect after ${this.retryAmount}`));
                this.destroy();
                return;
            }
            this.websocket!.removeAllListeners();
            this.websocket = null;
            this.erela.emit("nodeReconnect", this);
            this.connect();
            this.reconnectAttempts++;
        }, this.retryDelay);
    }

    /**
     * Destroys the Node.
     */
    public destroy(): void {
        if (!this.connected) { return; }
        this.websocket!.close(1000, "destroy");
        this.websocket!.removeAllListeners();
        this.websocket = null;
    }

    /**
     * Sends data to the Node.
     * @param {object} data - The data to send.
     */
    public send(data: object): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.connected) { return resolve(false); }
            if (!data || !JSON.stringify(data).startsWith("{")) { return reject(false); }
            this.websocket!.send(JSON.stringify(data), (error: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(true);
                }
            });
        });
    }

    private _onOpen(): void {
        if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); }
        this.erela.emit("nodeConnect", this);
    }

    private _onClose(code: number, reason: string): void {
        this.erela.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy") { this.reconnect(); }
    }

    private _onMessage(d: Buffer|string): void {
        if (Array.isArray(d)) { d = Buffer.concat(d); } else if (d instanceof ArrayBuffer) { d = Buffer.from(d); }

        const message = JSON.parse(d.toString());
        if (!message.op) { return; }

        switch (message.op) {
            case "stats":
                this.stats = { ...message };
                delete (this.stats as any).op;
                break;
            case "playerUpdate":
                const player = this.erela.players!.get(message.guildId);
                if (!player) { return; }
                player.position = message.state.position || 0;
                break;
            case "event":
                this.handleEvent(message);
                break;
            default:
                this.erela.emit("nodeError", new Error(`Unexpected op "${message.op}" with data ${message}`));
                return;
        }
    }

    private _onError(error: Error): void {
        if (!error) { return; }
        this.erela.emit("nodeError", this, error);
        this.reconnect();
    }

    private handleEvent(message: any): void {
        if (!message.guildId) { return; }
        const player = this.erela.players!.get(message.guildId);
        if (!player) { return; }
        const track = player.queue[0];
        switch (message.type) {
            case "TrackStartEvent": break;
            case "TrackEndEvent":
                if (track && player.trackRepeat) {
                    this.erela.emit("trackEnd", player, track);
                    player.play();
                } else if (track && player.queueRepeat) {
                    this.erela.emit("trackEnd", player, track);
                    player.queue.add(player.queue.shift());
                    player.play();
                } else if (player.queue.size === 1) {
                    player.queue.shift();
                    player.playing = false;
                    if (["REPLACED", "FINISHED", "STOPPED"].includes(message.reason)) {
                        this.erela.emit("queueEnd", player);
                    }
                } else if (player.queue.size > 0) {
                    player.queue.shift();
                    this.erela.emit("trackEnd", player, track);
                    player.play();
                }
                break;
            case "TrackStuckEvent":
                player.queue.shift();
                this.erela.emit("trackStuck", player, track, message);
                break;
            case "TrackExceptionEvent":
                player.queue.shift();
                this.erela.emit("trackError", player, track, message);
                break;
            case "WebSocketClosedEvent":
                if ([4015, 4009].includes(message.code)) {
                    this.erela.sendWS({
                        op: 4,
                        d: {
                            guild_id: message.guildId,
                            channel_id: player.voiceChannel.id || player.voiceChannel,
                            self_mute: player.options.selfMute || false,
                            self_deaf: player.options.selfDeaf || false,
                        },
                    });
                    break;
                }
                this.erela.emit("socketClosed", player, message);
                break;
            default:
                throw new Error(`Node#event Unknown event '${message.type}'.`);
        }
    }
 }
