import { Manager } from "./Manager";

export interface PlayerOptions {
    guild: string;
    voiceChannel: string;
    textChannel: string;
    volume?: number;
    selfMute?: boolean;
    selfDeafen?: boolean;
}

export interface NodeOptions {
    readonly host: string;
    readonly port: number;
    readonly password: string;
    readonly retryAmount?: number;
    readonly retryDelay?: number;
}

export class Player {
    static manager: Manager | null;
    static nodes = new Map<string, Node>();
    static players = new Map<string, Player>(); 
    protected options: PlayerOptions;
    constructor(options: PlayerOptions) {}

    public static init(manager: Manager): void {}
}
