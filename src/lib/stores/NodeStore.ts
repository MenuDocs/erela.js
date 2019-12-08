import { Collection } from "discord.js";
import { INode } from "../structures/Node";
import { INodeOptions, ErelaClient } from "../ErelaClient";

export default class NodeStore extends Collection<number, INode> {
    private readonly erela: ErelaClient;

    /**
     * Filters the connected nodes and sorts them by the amount of rest calls it has made.
     * @returns {Map<number, INode>}
     * @memberof Erela
     */
    public get leastUsed(): Collection<number, INode> {
        return this.filter((node) => node.connected).sort((a, b) => b.calls - a.calls);
    }

    /**
     * Filters the connected nodes and sorts them by the least resource usage.
     * @returns {Map<number, INode>}
     * @memberof Erela
     */
    public get leastLoad(): Collection<number, INode> {
        return this.filter((node) => node.connected).sort((a, b) => {
            const aload = a.stats.cpu ? a.stats.cpu.systemLoad / a.stats.cpu.cores * 100 : 0;
            const bload = b.stats.cpu ? b.stats.cpu.systemLoad / b.stats.cpu.cores * 100 : 0;
            return aload - bload;
        });
    }

    public constructor(erela: ErelaClient, nodes: INodeOptions[]) {
        super();
        this.erela = erela;
        for (const node of nodes) { this.spawn(node); }
    }

    /**
     * Adds a new Node.
     * @param {NodeOptions} node - The node options.
     * @param {object} [extra={}] - The nodes extra data to pass when extending for custom classes.
     * @memberof Erela
     */
    public spawn(options: INodeOptions, extra: object = {}): void {
        const node = new (this.erela.node as any)(this.erela, options, extra);
        this.set(this.size + 1, node);
        this.erela.emit("nodeCreate", node);
    }

    /**
     * Removes a new Node.
     * @param {number} nodeId - The node ID.
     * @returns {(INode|null)} - The node that was removed, or null if it does not exist.
     * @memberof Erela
     */
    public remove(nodeId: number): INode|null {
        const node = this.get(nodeId);
        if (!node) { return null; }
        node.destroy();
        this.delete(nodeId);
        return node;
    }
}
