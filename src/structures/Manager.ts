import { EventEmitter } from "events";
import { Node, NodeOptions } from "./Node";
import { Player } from "./Player";

export interface ManagerOptions {
    nodes: NodeOptions[];
}

export class Manager extends EventEmitter {
    protected players = new Map<string, Player>();
    protected nodes = new Map<string, Node>();
    protected clientId: string;

    constructor(protected options: ManagerOptions) {
        super();
        options.nodes.forEach((node: NodeOptions) => {
            const identifier = node.identifier || node.host;
            this.nodes.set(identifier, new Node(this, node));
        });
    }

    public init(clientId: string): void {
        this.clientId = clientId;
        this.nodes.forEach((node: Node) => node.connect());
        Player.init(this);
    }
}
