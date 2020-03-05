import Store from "../utils/Store";
import { Node, INodeOptions } from "../entities/Node";
import { ErelaClient } from "../ErelaClient";

/**
 * The NodeStore class.
 */
export default class NodeStore extends Store<any, Node> {
    /**
     * Filters the connected nodes and sorts them by the amount of rest calls it has made.
     */
    public get leastUsed(): Store<any, Node> {
        return this.filter((node) => node.connected).sort((a, b) => b.calls - a.calls);
    }

    /**
     * Filters the connected nodes and sorts them by the least resource usage.
     */
    public get leastLoad(): Store<any, Node> {
        return this.filter((node) => node.connected).sort((a, b) => {
            const aload = a.stats.cpu ? a.stats.cpu.systemLoad / a.stats.cpu.cores * 100 : 0;
            const bload = b.stats.cpu ? b.stats.cpu.systemLoad / b.stats.cpu.cores * 100 : 0;
            return aload - bload;
        });
    }

    /**
     * Creates an instance of NodeStore.
     * @param {ErelaClient} erela - The ErelaClient.
     * @param {Array<INodeOptions>} nodes - The INodeOptions array.
     */
    public constructor(public readonly erela: ErelaClient, nodes: INodeOptions[]) {
        super();
        for (const node of nodes) { this.spawn(node); }
    }

    /**
     * Adds a new Node.
     * @param {INodeOptions} node - The node options.
     * @param {object} [extra={}] - The nodes extra data to pass when extending for custom classes.
     */
    public spawn(options: INodeOptions, extra: object = {}): void {
        const node = new this.erela.node(this.erela, options, extra);
        this.set(options.identifer || this.size + 1, node);
        this.erela.emit("nodeCreate", node);
    }

    /**
     * Removes a new Node.
     * @param {any} nodeId - The node ID.
     * @returns {(INode|null)} - The node that was removed, or null if it does not exist.
     */
    public remove(nodeId: any): Node|null {
        const node = this.get(nodeId);
        if (!node) { return null; }
        this.erela.emit("nodeDestroy", node);
        node.destroy();
        this.delete(nodeId);
        return node;
    }
}
