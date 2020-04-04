import { Player, IPlayerOptions } from "../classes/Player";
import { Store } from "../utils/Store";
import { ErelaClient } from "../ErelaClient";
import { Node } from "../classes/Node";
import _ from "lodash";

/**
 * The PlayerStore class.
 */
export class PlayerStore extends Store<string, Player> {
    /**
     * Creates an instance of PlayerStore.
     * @param {ErelaClient} erela The ErelaClient.
     */
    public constructor(public readonly erela: ErelaClient) {
        super();
    }

    /**
     * Spawns a Player, or returns the Player if it exists.
     * @param {IPlayerOptions} options The options to spawn a Player with.
     * @returns {Player} The newly created Player, or the existing Player.
     */
    public spawn(options: IPlayerOptions): Player {
        if (this.has(options.guild)) {
            return this.get(options.guild) as Player;
        }

        const node: Node = this.erela.nodes.leastLoad.first() as Node;

        if (!node) {
            throw new Error("PlayerStore#spawn() No available nodes.");
        }

        options = {
            ...options,
            selfDeaf: options.selfDeaf || false,
            selfMute: options.selfMute || false,
        };

        const clazz = this.erela.classes.get("Player");
        const player = new clazz(this.erela, node, options) as Player;
        this.set(options.guild, player);
        this.erela.emit("playerCreate", player);
        return player;
    }

    /**
     * Destroys a Player.
     * @param {string} guildId The guild ID to destroy the Player with.
     * @returns {(Player|null)} The Player or null if it does not exist.
     */
    public destroy(guildId: string): Player | null {
        const player = this.get(guildId);
        if (!player) { return null; }

        this.erela.emit("playerDestroy", player);
        this.delete(guildId);

        player.node.send({
            op: "destroy",
            guildId,
        });

        return player;
    }
}
