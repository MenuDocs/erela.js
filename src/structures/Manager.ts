import { EventEmitter } from 'events';
import { container } from 'tsyringe';

export class Manager extends EventEmitter {

    /**
     * The user id of the bot this Manager is managing
     */
     public user!: string;

    /**
     * The amount of shards the bot has, by default its 1
     */
    public shardCount: number;

    /**
     * The Players assoicated to this Manager.
     */
    public players: Map<string, string>;

    public constructor() {
        super();
        
        container
            .registerInstance(Manager, this)
            .registerInstance('Manager', this)
    }
}