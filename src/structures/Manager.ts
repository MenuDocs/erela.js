import { EventEmitter } from "events";
import { Node, NodeOptions } from "./Node";
import { Player } from "./Player";
import { Queue } from "./Queue";

export interface ManagerOptions {
    nodes?: NodeOptions[];
    player?: Player;
    node?: Node;
    queue?: Queue;
    clientId?: string;
    shards?: number;
    plugins?: any[];
}

export class Manager extends EventEmitter {
    public readonly players = new Map<string, Player>();
    public readonly nodes = new Map<string, Node>();
    public readonly options: ManagerOptions;

    constructor(options?: ManagerOptions) {
        super();

        this.options = {
            nodes: [{
                host: "localhost",
                port: 2333,
                password: "youshallnotpass",
            }],
            shards: 1,
            ...options,
        };

        this.options.nodes.forEach((node: NodeOptions) => {
            const identifier = node.identifier || node.host;
            this.nodes.set(identifier, new Node(this, node));
        });
    }

    public init(clientId?: string): void {
        if (clientId) this.options.clientId = clientId;
        if (!this.options.clientId) {
            throw new Error("\"clientId\" is not set. Pass it in Manager#init() or as a option in the constructor.");
        }

        this.nodes.forEach((node: Node) => node.connect());
        Player.init(this);
    }
}
