import { Player, IPlayerOptions } from "../entities/Player";
import Store from "../utils/Store";
import { ErelaClient } from "../ErelaClient";
import { Node } from "../entities/Node";
import _ from "lodash";

/**
 * The PlayerStore class.
 */
export default class PlayerStore extends Store<string, Player> {
    private readonly erela: ErelaClient;

    /**
     * Creates an instance of PlayerStore.
     * @param {ErelaClient} erela - The ErelaClient.
     */
    public constructor(erela: ErelaClient) {
        super();
        this.erela = erela;
    }

    /**
     * Spawns a new player, or returns the player if it exists.
     * @param {IPlayerOptions} options - The options to spawn a player with.
     * @param {object} [extra={}] - Extra data to pass when extending for custom classes.
     * @returns {Player} - The newly created Player.
     */
    public spawn(options: IPlayerOptions, extra: object = {}): Player {
        if (this.has(options.guild.id || options.guild)) {
            return this.get(options.guild.id || options.guild) as Player;
        }

        const node: Node = this.erela.nodes.leastLoad.first() as Node;

        if (!node) {
            throw new Error("PlayerStore#spawn() No available nodes.");
        }

        const player = new (this.erela.player as any)(this.erela, node, options, extra);
        this.set(options.guild.id || options.guild, player);
        this.erela.emit("playerCreate", player);
        this.erela.sendWS({
            op: 4,
            d: {
                guild_id: options.guild.id || options.guild,
                channel_id: options.voiceChannel.id || options.voiceChannel,
                self_mute: options.selfMute || false,
                self_deaf: options.selfDeaf || false,
            },
        });

        return player;
    }

    /**
     * Destroys a player.
     * @param {string} guildId - The guild ID to destroy the player with.
     * @returns {(Player|null)} - The Player or null if it does not exist.
     */
    public destroy(guildId: string): Player|null {
        const player = this.get(guildId);
        if (!player) { return null; }

        this.erela.emit("playerDestroy", player);
        this.erela.sendWS({
            op: 4,
            d: {
                guild_id: guildId,
                channel_id: null,
                self_mute: false,
                self_deaf: false,
            },
        });

        player.node.send({
            op: "destroy",
            guildId,
        });
        this.delete(guildId);

        return player;
    }
}
