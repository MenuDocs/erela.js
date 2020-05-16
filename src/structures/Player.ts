import { Manager } from "./Manager";
import { Extendable, mix } from "./Utils";
import { EventEmitter } from "events";

export interface PlayerOptions {
    guild: string;
    voiceChannel: string;
    textChannel: string;
    node?: string;
    volume?: number;
    selfMute?: boolean;
    selfDeafen?: boolean;
}

export interface Player extends Extendable, EventEmitter {}

export class Player {
    public static manager: Manager | null;

    public static init(manager: Manager): void {
        this.manager = manager;
    }

    constructor(protected options: PlayerOptions) {
        if (Player.manager.players.has(options.guild)) {
            return Player.manager.players.get(options.guild);
        }
        Player.manager.players.set(options.guild, this);
    }
}

mix(Player, Extendable, EventEmitter);
