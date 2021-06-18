import { Player, PlayerOptions, State } from "erela.js-api";
import { container } from "tsyringe";
import { LavalinkManager } from "./LavalinkManager";
import { LavalinkNode } from "./LavalinkNode";
import { OutgoingEvents } from "../types/Events" 
import { OutgoingPlayPayload } from "../types/OutgoingPayloads";

export interface LavalinkPlayerOptions extends PlayerOptions {
    node?: string;
}

export class LavalinkPlayer implements Player {
    node: LavalinkNode;
    options: LavalinkPlayerOptions;
    guild: string;
    textChannel?: string;
    voiceChannel?: string;
    position?: number;
    playing?: boolean;
    paused?: boolean;
    volume?: number;
    state?: State;
    voiceState: any = {};

    public constructor(options: Partial<LavalinkPlayerOptions>) {
        this.options = options as LavalinkPlayerOptions;

        this.guild = options.guild;
        this.textChannel = options.textChannel ?? null;
        this.voiceChannel = options.voiceChannel ?? null;

        
        // const node = this.manager.nodes.get(options.node);
        // this.node = node || this.manager.leastLoadNodes.first();
        this.node = this.manager.leastLoadNodes.first();
    }

	/**
	 * The manager associated to this Node.
	 */
	public get manager(): LavalinkManager {
		return container.resolve<LavalinkManager>('LavalinkManager');
	}

    public async connect(channel?: string): Promise<void> {
        if (!(this.voiceChannel = channel)) throw new RangeError("No voice channel has been set.");
        this.state = State.CONNECTING;
    
        await this.manager.options.send(this.guild, {
          op: 4,
          d: {
            guild_id: this.guild,
            channel_id: channel ?? this.voiceChannel,
            self_mute: this.options.selfMute || false,
            self_deaf: this.options.selfDeafen || false,
          },
        });
    
        this.state = State.CONNECTED;
    }

    public async play(track: string): Promise<void> {
        const options: OutgoingPlayPayload = {
            op:OutgoingEvents.PLAY,
            guildId: this.guild,
            track
        };
    
        await this.node.send(options);
    }

    disconnect(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    destroy(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    
}