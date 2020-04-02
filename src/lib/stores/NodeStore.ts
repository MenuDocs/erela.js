import { Store } from "../utils/Store";
import { Node, INodeOptions } from "../classes/Node";
import { ErelaClient } from "../ErelaClient";

/**
 * The NodeStore class.
 */
export class NodeStore extends Store<string, Node> {
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
     * @param {ErelaClient} erela The ErelaClient.
     */
    public constructor(public readonly erela: ErelaClient) {
        super();
    }

    /**
     * Adds a new Node.
     * @param {INodeOptions} node The node options.
     */
    public spawn(options: INodeOptions): void {
        if (this.has(options.identifer || options.host)) {
            throw new Error(`NodeStore#spawn() Node with identifier "${options.identifer || options.host}" already exists.`);
        }

        const clazz = this.erela.classes.get("Node");
        const node = new clazz(this.erela, options);
        this.set(options.identifer || options.host, node);
        this.erela.emit("nodeCreate", node);
    }

    /**
     * Removes a new Node.
     * @param {any} identifer The node identifer (or host if none was provided).
     * @returns {(INode|null)} The node that was removed, or null if it does not exist.
     */
    public remove(identifer: any): Node | null {
        const node = this.get(identifer);
        if (!node) { return null; }
        this.erela.emit("nodeDestroy", node);
        node.destroy();
        this.delete(identifer);
        return node;
    }
}
