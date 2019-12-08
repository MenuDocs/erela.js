import { Collection } from "discord.js";
import { IPlayer } from "../structures/Player";
import { ErelaClient, IPlayerOptions } from "../ErelaClient";

export default class PlayerStore extends Collection<string, IPlayer> {
    private readonly erela: ErelaClient;

    public constructor(erela: ErelaClient) {
        super();
        this.erela = erela;
    }

    /**
     * Spawns a new player, or returns the player if it exists.
     * @param {PlayerOptions} options - The options to spawn a player with.
     * @param {object} [extra={}] - Extra data to pass when extending for custom classes.
     * @returns {IPlayer}
     * @memberof PlayerStore
     */
    public spawn(options: IPlayerOptions, extra: object = {}): IPlayer {
        if (this.has(options.guild.id)) {
            return this.get(options.guild.id) as IPlayer;
        }

        const node = this.erela.nodes.leastLoad.first();

        if (!node) {
            throw new Error("PlayerStore#spawn() No available nodes.");
        }

        // tslint:disable-next-line: max-line-length
        const player = new (this.erela.player as any)(this.erela, node, options, extra);
        this.set(options.guild.id, player);
        this.erela.emit("playerCreate", player);
        this.erela.sendWS({
            op: 4,
            d: {
                guild_id: options.guild.id,
                channel_id: options.voiceChannel.id,
                self_mute: options.selfMute || false,
                self_deaf: options.selfDeaf || false,
            },
        });

        return player;
    }

    /**
     * Destroys a player.
     * @param {string} guildId - The guild ID to destroy the player with.
     * @returns {(IPlayer|null)}
     * @memberof Erela
     */
    public destroy(guildId: string): IPlayer|null {
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
