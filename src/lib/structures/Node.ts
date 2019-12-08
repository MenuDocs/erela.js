import WebSocket from "ws";
import { ErelaClient, INodeOptions } from "../ErelaClient";

/**
 * The NodeStats interface.
 * @export
 * @interface NodeStats
 */
export interface INodeStats {
    players: number;
    playingPlayers: number;
    uptime: number;
    memory: {
        free: number;
        used: number;
        allocated: number;
        reservable: number;
    };
    cpu: {
        cores: number;
        systemLoad: number;
        lavalinkLoad: number;
    };
    frameStats?: {
        sent?: number;
        nulled?: number;
        deficit?: number;
    };
}

/**
 * The INode interface.
 * @export
 * @interface INode
 */
export interface INode {
    readonly erela: ErelaClient;
    options: INodeOptions;
    websocket: WebSocket|null;
    stats: INodeStats;
    reconnectTimeout?: NodeJS.Timeout;
    reconnectAttempts: number;
    retryAmount: number;
    retryDelay: number;
    calls: number;
    readonly connected: boolean;
    setOptions(options: INodeOptions): void;
    connect(): void;
    reconnect(): void;
    destroy(): void;
    send(message: object): void;
    _onOpen(data: WebSocket.Data): void;
    _onClose(code: number, reason: string): void;
    _onMessage(data: WebSocket.Data): void;
    _onError(error: Error): void;
}

/**
 * The Node class.
 * @export
 * @class Node
 * @implements {INode}
 */
export class Node implements INode {
    public readonly erela: ErelaClient;
    public options: INodeOptions;
    public websocket: WebSocket|null;
    public stats: INodeStats;
    public reconnectTimeout?: NodeJS.Timeout;
    public reconnectAttempts: number = 0;
    public retryAmount: number;
    public retryDelay: number;
    public calls: number = 0;

    /**
     * Returns if connected to the Node.
     * @returns {boolean}
     * @memberof Node
     */
    public get connected(): boolean {
        if (!this.websocket) { return false; }
        return this.websocket!.readyState === WebSocket.OPEN;
    }

    /**
     * Creates an instance of Node and connects after being created.
     * @param {ErelaClient} erela - The Erela client.
     * @param {NodeOptions} options - The Node options.
     * @memberof Node
     */
    public constructor(erela: ErelaClient, options: INodeOptions) {
        this.erela = erela;
        this.options = options;
        this.retryAmount = this.options.retryAmount || 5;
        this.retryDelay = this.options.retryDelay || 30e3;
        this.websocket = null;
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
     * @memberof Node
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
     * @returns {void}
     * @memberof Node
     */
    public connect(): void {
        const headers = {
            "Authorization": this.options.password,
            "Num-Shards": String(this.erela.shardCount),
            "User-Id": this.erela.client.user.id,
        };

        this.websocket = new WebSocket(`ws://${this.options.host}:${this.options.port}/`, { headers });

        this.websocket.on("open", this._onOpen.bind(this));
        this.websocket.on("close", this._onClose.bind(this));
        this.websocket.on("message", this._onMessage.bind(this));
        this.websocket.on("error", this._onError.bind(this));
    }

    /**
     * Reconnects to the Node.
     * @returns {void}
     * @memberof Node
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
     * @returns {void}
     * @memberof Node
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
     * @returns {void}
     * @memberof Node
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

    /**
     * Handles the websocket opening.
     * @returns {void}
     * @memberof Node
     */
    public _onOpen(): void {
        if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); }
        this.erela.emit("nodeConnect", this);
    }

    /**
     * Handles the websocket closing.
     * @param {number} code - The close code.
     * @param {string} reason - The close reason.
     * @returns {void}
     * @memberof Node
     */
    public _onClose(code: number, reason: string): void {
        this.erela.emit("nodeDisconnect", this, { code, reason });
        if (code !== 1000 || reason !== "destroy") { this.reconnect(); }
    }

    /**
     * Handles incoming messages from Erela.
     * @param {Buffer|string} d - The message from the websocket.
     * @returns {void}
     * @memberof Node
     */
    public _onMessage(d: Buffer|string): void {
        if (Array.isArray(d)) { d = Buffer.concat(d); } else if (d instanceof ArrayBuffer) { d = Buffer.from(d); }

        const message = JSON.parse(d.toString());
        if (!message.op) { return; }

        switch (message.op) {
            case "stats":
                this.stats = { ...message };
                delete (this.stats as any).op;
                break;
            case "playerUpdate":
                const player = this.erela.players.get(message.guildId);
                if (!player) { return; }
                player.updateState({
                    time: message.state.time,
                    position: message.state.position || 0,
                    volume: message.state.volume,
                    equalizer: message.state.equalizer,
                });
                break;
            case "event":
                this.handleEvent(message);
                break;
            default:
                this.erela.emit("nodeError", new Error(`Unexpected op "${message.op}" with data ${message}`));
                return;
        }
    }

    /**
     * Handles errors from the websocket.
     * @param {Error} error - The error.
     * @returns {void}
     * @memberof Node
     */
    public _onError(error: Error): void {
        if (!error) { return; }
        this.erela.emit("nodeError", this, error);
        this.reconnect();
    }

    /**
     * Handles the events received from Erela.
     * @param {*} message - The message sent from Erela.
     * @returns {void}
     * @memberof Node
     */
    public handleEvent(message: any): void {
        if (!message.guildId) { return; }
        const player = this.erela.players.get(message.guildId);
        if (!player) { return; }
        const track = player.queue.shift();
        switch (message.type) {
            case "TrackEndEvent":
                if (track && player.trackRepeat) {
                    this.erela.emit("trackEnd", player, track);
                    player.queue.unshift(track);
                    player.play();
                } else if (track && player.queueRepeat) {
                    this.erela.emit("trackEnd", player, track);
                    player.queue.add(track);
                    player.play();
                } else if (player.queue.size === 0) {
                    if (message.reason === "FINISHED") {
                        player.playing = false;
                        this.erela.emit("queueEnd", player);
                    }
                } else if (player.queue.size > 0) {
                    this.erela.emit("trackEnd", player, track);
                    player.play();
                }
                break;
            case "TrackStuckEvent":
                this.erela.emit("trackStuck", player, track);
                break;
            case "TrackExceptionEvent":
                this.erela.emit("trackError", player, track);
                break;
            case "WebSocketClosedEvent":
                if ([4015, 4009].includes(message.code)) {
                    this.erela.sendWS({
                        op: 4,
                        d: {
                            guild_id: player.guild.id,
                            channel_id: player.voiceChannel.id,
                            self_mute: player.options.selfMute || false,
                            self_deaf: player.options.selfDeaf || false,
                        },
                    });
                    break;
                }
                this.erela.emit("socketClosed", player, message);
                break;
        }
    }
 }
