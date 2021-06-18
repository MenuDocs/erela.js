/* eslint-disable @typescript-eslint/no-var-requires */

import { container } from 'tsyringe';
import EventEmitter from 'events';

import { Manager, ManagerOptions, PlayerOptions } from 'erela.js-api';
import { LavalinkPlayer } from './LavalinkPlayer';
import Collection from '@discordjs/collection';
import { LavalinkNode, NodeOptions } from './LavalinkNode';

export interface LavalinkManagerOptions extends ManagerOptions {
    nodes: NodeOptions[];
    send: (id: string, payload: NodeJS.Dict<unknown>) => Promise<void>;
}

const TEMPLATE = JSON.stringify(["event", "guildId", "op", "sessionId"]);

export class LavalinkManager extends EventEmitter implements Manager {
    /**
     * The Manager version.
     */
    public version: string = require("../../package.json").version;

    /**
     * The user id of the bot this Manager is managing
     */
    public user!: string;

    /**
     * The amount of shards the bot has, by default it's 1
     */
    public shardCount = 1;

    /**
     * The Nodes associated to this Manager.
     */
    public nodes = new Collection<string, LavalinkNode>()

    /**
     * The Players associated to this Manager.
     */
    public players = new Collection<string, LavalinkPlayer>()

    /**
     * The options for the lavalink audio provider.
     */
    public options: LavalinkManagerOptions;

    public constructor(options: LavalinkManagerOptions) {
        super();

        this.options = options;

        // plugins

        for (const nodeOptions of this.options.nodes) {
            const node = new LavalinkNode(nodeOptions);
            this.nodes.set(node.id, node);
        }

        container
            .registerInstance(LavalinkManager, this)
            .registerInstance('LavalinkManager', this)
    }


    /** Returns the least used Nodes. */
    public get leastUsedNodes(): Collection<string, LavalinkNode> {
        return this.nodes
            .filter((node) => node.connected)
            .sort((a, b) => b.calls - a.calls);
    }

    /** Returns the least system load Nodes. */
    public get leastLoadNodes(): Collection<string, LavalinkNode> {
        return this.nodes
            .filter((node) => node.connected)
            .sort((a, b) => {
                const aload = a.stats.cpu
                    ? (a.stats.cpu.systemLoad / a.stats.cpu.cores) * 100
                    : 0;
                const bload = b.stats.cpu
                    ? (b.stats.cpu.systemLoad / b.stats.cpu.cores) * 100
                    : 0;
                return aload - bload;
            });
    }
    public async init(user: string): Promise<void> {
        this.user = user;
        
        await Promise.all(this.nodes.map(node => node.connect()))
    }

    use(plugin: Plugin): void;
    use(plugins: Plugin[]): void;
    use(plugins: Plugin | Plugin[]): void {
        plugins;
        throw new Error('Method not implemented.');
    }

    create(guild: string): LavalinkPlayer;
    create(options: PlayerOptions): LavalinkPlayer;
    create(guildOrOptions: string | PlayerOptions): LavalinkPlayer {
        const guild = typeof guildOrOptions === "string" ? guildOrOptions : guildOrOptions.guild;

        if (this.players.has(guild)) {
            return this.players.get(guild);
        }

        const options = typeof guildOrOptions === "string" ? { guild: guildOrOptions } : guildOrOptions;
        const player = new LavalinkPlayer(options);

        this.players.set(guild, player);

        return player
    }

    destroy(guild: string): void;
    destroy(player: LavalinkPlayer): void;
    destroy(player: string | LavalinkPlayer): void {
        player;
        throw new Error('Method not implemented.');
    }


    /**
     * Sends voice data to the Lavalink server.
     * @param data
     */
    public async updateVoiceState(data: any): Promise<void> {
        if (
            !data ||
            !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(data.t || "")
        )
            return;
        const player = this.players.get(data.d.guild_id);

        if (!player) return;
        const state = player.voiceState;

        if (data.t === "VOICE_SERVER_UPDATE") {
            state.op = "voiceUpdate";
            state.guildId = data.d.guild_id;
            state.event = data.d;
        } else {
            if (data.d.user_id !== this.user) return;
            state.sessionId = data.d.session_id;

            if (player.voiceChannel !== data.d.channel_id) {
                this.emit("playerMove", player, player.voiceChannel, data.d.channel_id);
                data.d.channel_id = player.voiceChannel;
            }
        }

        player.voiceState = state;
        if (JSON.stringify(Object.keys(state).sort()) === TEMPLATE)
            await player.node.send(state);
    }
}