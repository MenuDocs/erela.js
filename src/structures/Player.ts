import { Manager } from "./Manager";

export interface PlayerOptions {
    guild: string;
    voiceChannel: string;
    textChannel: string;
    node?: string;
    volume?: number;
    selfMute?: boolean;
    selfDeafen?: boolean;
}

export class Player {
    public static manager: Manager | null;

    public static init(manager: Manager): void {
        this.manager = manager;
    }

    constructor(protected options: PlayerOptions) {
        
    }
}
