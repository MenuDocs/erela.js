import { Manager } from "./Manager";
import { Extendable } from "./Utils";

export interface NodeOptions {
    readonly host: string;
    readonly port: number;
    readonly password: string;
    readonly identifier?: string;
    readonly retryAmount?: number;
    readonly retryDelay?: number;
}

export class Node extends Extendable {
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
