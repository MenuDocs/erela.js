import { Manager } from "./Manager";
import { Extendable } from "./Utils";
import WebSocket from "ws";

export interface NodeOptions {
    readonly host: string;
    readonly port: number;
    readonly password: string;
    readonly identifier?: string;
    readonly retryAmount?: number;
    readonly retryDelay?: number;
}

export class Node extends Extendable {
    protected readonly socket: WebSocket | null;

    constructor(
        protected manager: Manager,
        protected options: NodeOptions,
    ) {
        super();
    }

    // tslint:disable-next-line: no-empty
    public connect(): void {

    }
}
