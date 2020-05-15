import { EventEmitter } from "events";
import { Player } from './Player';

export interface ManagerOptions {
    nodes: object[];
}

export class Manager extends EventEmitter {
    protected id: string;
    constructor(protected options: ManagerOptions) {
        super();
    }

    init(clientId: string): void {
        this.id = clientId;
        return Player.init(this);
    }
}
