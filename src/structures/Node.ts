import WebSocket from 'ws';
import { once } from 'events';
import { container } from 'tsyringe';
import { ConnectionEvents, OutgoingEvents, WebSocketEvents } from '../types/Events';
import { enumerable, isObject, mergeDefault, DefaultNodeOptions, DefaultStatsOptions } from '../util';

import type { Manager } from './Manager';
import type { IncomingPayload, IncomingStatsPayload } from '../types/IncomingPayloads';
import type { OutgoingPayload } from '../types/OutgoingPayloads';

interface Sendable {
	resolve: () => void;
	reject: (e: Error) => void;
	data: Buffer | string;
}

export class Node implements NodeOptions {

	/**
	 * The id of the Node.
	 */
	public id: NodeOptions['id'];
	
	/**
	 * The host of the Node, this could be ip or domain.
	 */
	@enumerable(false)
	public host: NodeOptions['host'];
	
	/**
	 * The password to the Node.
	 */
	@enumerable(false)
	public password: NodeOptions['password'];

	/**
	 * The port to the Node.
	 */
	@enumerable(false)
	public port: NodeOptions['port'];

	/**
     * The interval that the node will try to reconnect to lavalink at in milliseconds
     */
	public reconnectInterval: NodeOptions['reconnectInterval'];


	/**
	 * The statistics of this Node.
	 */
	public stats: IncomingStatsPayload;

	/**
	 * The resume key to send to the Node so you can resume properly.
	 */
	public resumeKey?: NodeOptions['resumeKey'];

	/**
	 * The resume timeout.
	 */
	public resumeTimeout: NodeOptions['resumeTimeout'];

	/**
	 * The websocket instance for this Node.
	 */
	public ws: WebSocket | null = null;

	/**
     * The reconnect timeout
     */
	#reconnect?: NodeJS.Timeout;

	/**
	 * The queue of requests to be processed.
	 */
	#queue: Sendable[] = [];

	/**
	 * The bound callback function for `wsSend`.
	 */
	#send: Node['wsSend'];
	/**
	 * The bound callback function for `onOpen`.
	 */
	#open: Node['onOpen'];

	/**
	 * The bound callback function for `onClose`.
	 */
	#close: Node['onClose'];

	/**
	 * The bound callback function for `onMessage`.
	 */
	#message: Node['onMessage'];

	/**
	 * The bound callback function for `onError`.
	 */
	#error: Node['onError'];

	/**
	 * The base of the connection to lavalink.
	 * @param options The options of the Node {@link NodeOptions} 
	 */
    public constructor(options: Partial<NodeOptions>) {
		if (!isObject(options)) throw TypeError('The node options should be of type object!');
		mergeDefault(DefaultNodeOptions as Required<NodeOptions>, options);
		mergeDefault(DefaultStatsOptions as Required<Omit<IncomingStatsPayload, 'op'>>, this.stats);
		this.id = options.id;
		this.host = options.host;
		this.port = options.port;
		this.password = options.password;
		this.reconnectInterval = options.reconnectInterval;
		this.resumeKey = options.resumeKey;
		this.resumeTimeout = options.resumeTimeout;

		this.#send = this.wsSend.bind(this);
		this.#open = this.onOpen.bind(this);
		this.#close = this.onClose.bind(this);
		this.#message = this.onMessage.bind(this);
		this.#error = this.onError.bind(this);

    }

	/**
	 * The manager assoicated to this Node.
	 */
    public get manager(): Manager {
        return container.resolve<Manager>('Manager');
    }

	/**
     * Whether or not the node is connected
     */
	public get connected(): boolean {
		if (!this.ws) return false;
		return this.ws.readyState === WebSocket.OPEN;
	}


	/**
	 * Sends a message to the websocket.
	 * @param payload The data to be sent to the websocket.
	 */
	public send(payload: OutgoingPayload): Promise<void> {
		if (!this.ws) return Promise.reject(new Error('The client has not been initialized.'));
	
		return new Promise((resolve, reject) => {
			const encoded = JSON.stringify(payload);
			const send = { resolve, reject, data: encoded };
	
			if (this.ws.readyState === WebSocket.OPEN) this.wsSend(send);
			else this.#queue.push(send);
		});
	}

	/**
	 * Closes the WebSocket connection.
	 * @param code The close code.
	 * @param data The data to be sent.
	 */
	public async close(code?: number, data?: string): Promise<boolean> {
		if (!this.ws) return false;
	
		this.ws.off(WebSocketEvents.CLOSE, this.#close);
	
		this.ws.close(code, data);
	
		this.manager.emit(ConnectionEvents.CLOSE, ...(await once(this.ws, WebSocketEvents.CLOSE)));
		this.ws.removeAllListeners();
		this.ws = null;
	
		return true;
	}

	public async connect(): Promise<void> {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.close();
			this.ws.removeAllListeners();

			this.manager.emit(ConnectionEvents.CLOSE, ...(await once(this.ws, WebSocketEvents.CLOSE)));
		}
		const headers: Record<string, string> = {
			Authorization: this.password,
			'Num-Shards': String(this.manager.shardCount ?? 1),
			'Client-Name': `erela.js v${this.manager.version}`,
			'User-Id': this.manager.user
		};

		if (this.resumeKey) headers['Resume-Key'] = this.resumeKey;


		const ws = new WebSocket(`ws://${this.host}:${this.port}/`, { headers });
		this._registerWSEventListeners();

		return new Promise<void>((resolve, reject) => {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const self = this;

			function onOpen() {
				resolve();
				cleanup();
			}

			function onError(error: Error) {
				self.ws = null;
				reject(error);
				cleanup();
			}

			function onClose(code: number, reason: string) {
				self.ws = null;
				reject(new Error(`Closed connection with code ${code} and reason ${reason}`));
				cleanup();
			}

			function cleanup() {
				ws.off(WebSocketEvents.OPEN, onOpen);
				ws.off(WebSocketEvents.ERROR, onError);
				ws.off(WebSocketEvents.CLOSE, onClose);
			}

			ws.on(WebSocketEvents.OPEN, onOpen);
			ws.on(WebSocketEvents.ERROR, onError);
			ws.on(WebSocketEvents.CLOSE, onClose);
		});
	}

	/**
	 * Configures the resuming for this connection.
	 * @param timeout The number of seconds after disconnecting before the session is closed anyways.
	 * This is useful for avoiding accidental leaks.
	 * @param key The key to send when resuming the session. Set to `null` or leave unset to disable resuming.
	 */
     public configureResuming(timeout = this.resumeTimeout, key: string | null = null): Promise<void> {
		this.resumeKey = key;

		return this.send({
			op: OutgoingEvents.CONFIGURE_RESUMING,
			key,
			timeout
		});
	}

	private _registerWSEventListeners() {
		if (!this.ws.listeners(WebSocketEvents.OPEN).includes(this.#open)) this.ws.on(WebSocketEvents.OPEN, this.#open);
		if (!this.ws.listeners(WebSocketEvents.CLOSE).includes(this.#close)) this.ws.on(WebSocketEvents.CLOSE, this.#close);
		if (!this.ws.listeners(WebSocketEvents.MESSAGE).includes(this.#message)) this.ws.on(WebSocketEvents.MESSAGE, this.#message);
		if (!this.ws.listeners(WebSocketEvents.ERROR).includes(this.#error)) this.ws.on(WebSocketEvents.ERROR, this.#error);
	}


	private wsSend({ resolve, reject, data }: Sendable) {
		this.ws.send(data, (err) => {
			if (err) reject(err);
			else resolve();
		});
	}

	private onOpen(): void {
		if (this.#reconnect) clearTimeout(this.#reconnect);
		this.manager.emit(ConnectionEvents.OPEN);
		this._flush()
			.then(() => this.configureResuming(this.resumeTimeout, this.resumeKey))
			.catch((e) => this.manager.emit(ConnectionEvents.ERROR, e));
	}

	private onClose(code: number, reason: string): void {
		this.manager.emit(ConnectionEvents.CLOSE, code, reason);
		this._reconnect();
	}

	private onError(err: Error): void {
		this.manager.emit(ConnectionEvents.ERROR, err);
		this._reconnect();
	}

	private onMessage(d: WebSocket.Data): void {
		if (Array.isArray(d)) d = Buffer.concat(d);
		else if (d instanceof ArrayBuffer) d = Buffer.from(d);

		let pk: IncomingPayload;
		try {
			pk = JSON.parse((d as string | Buffer).toString());
		} catch (e) {
			this.manager.emit(ConnectionEvents.ERROR, e);
			return;
		}

		if ('guildId' in pk) this.manager.players.get(pk.guildId)?.emit(pk.op, pk);

		this.manager.emit(pk.op, pk);
	}

	private _reconnect() {
		this.#reconnect = setTimeout(() => {
            this.ws.removeAllListeners();
            this.ws = null;

            this.manager.emit('reconnecting', this);
            this.connect();
        }, this.reconnectInterval);
	}

	private async _flush() {
		await Promise.all(this.#queue.map(this.#send));
		this.#queue = [];
	}

}

/**
 * The options for the node.
 */
 export interface NodeOptions {

	/**
	 * Id of the node.
	 * @example
	 * ```json
	 * 'node1'
	 * ```
	 */
	id: string;

	/**
	 * The password to use to login to the Lavalink server.
	 * @example
	 * ```json
	 * 'you-shall-not-pass'
	 * ```
	 */
	password: string;

	/**
	 * A URL to your Lavalink instance without protocol.
	 * @example
	 * ```json
	 * 'localhost'
	 * ```
	 */
	host: string;

	/**
	 * Port to your lavalink instance.
	 * @example
	 * ```json
	 * 2333
	 * ```
	 */
	port: number;

	/**
	 * The resume key to send to the Node so you can resume properly.
	 * @example
	 * ```json
	 * erela
	 * ```
	 */
	resumeKey?: string;

    /**
     * The resume timeout
	 * @example
	 * ```json
	 * 120
	 * ```
     */
	resumeTimeout: number;

    /**
     * The interval that the node will try to reconnect to lavalink at in milliseconds.
	 * @example
	 * ```json
	 * 10000
	 * ```
     */
	reconnectInterval: number;

}



