import { Manager } from "./Manager";

export interface NodeOptions {
    readonly host: string;
    readonly port: number;
    readonly password: string;
    readonly identifier?: string;
    readonly retryAmount?: number;
    readonly retryDelay?: number;
}

export class Node {
    constructor(
        protected manager: Manager,
        protected options: NodeOptions,
    ) {

    }

    public connect(): void {
        
    }
}
