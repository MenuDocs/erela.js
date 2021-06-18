import { State } from "../impl/State";
import { Manager } from "./Manager";

/**
 * The base PlayerOptions.
 */
export interface PlayerOptions {
    /**
     * The guild the Player belongs to.
     */
    readonly guild: string;

    /**
     * The text channel the Player belongs to.
     */
    textChannel?: string;

    /**
     * The voice channel the Player belongs to.
     */
    voiceChannel?: string;

    /**
     * The initial volume the Player will use.
     */
    volume?: number;

    /**
     * If the player should mute itself.
     */
    selfMute?: boolean;

    /**
     * If the player should deaf itself.
     */
    selfDeafen?: boolean;
}

/**
 * The base Player.
 */
export interface Player<M extends Manager<unknown, any>, O extends PlayerOptions> {
    /**
     * The options for this Player.
     */
    readonly options: O;

    /**
     * The manager
     */
    readonly manager: M;

    /**
     * The guild this Player is bound to.
     */
    readonly guild: string;

    /**
     * The guild text channel this Player is bound to.
     */
    textChannel?: string | null;

    /**
     * The guild voice channel this Player is bound to and will join.
     */
    voiceChannel?: string | null;

    /**
     * The time position in the track the player is currently at.
     */
    position?: number | null;

    /**
     * Whether is the player is currently playing a track.
     */
    playing?: boolean | null;

    /**
     * Whether is the player is currently paused.
     */
    paused?: boolean | null;

    /**
     * The volume the player is playing at.
     */
    volume?: number | null;

    /**
     * The state the player is in.
     */
    state?: State | null;

    /**
     * Connects to the specified voice channel or the one provided as an option.
     * @param channel string
     */
    connect(channel?: string): Promise<void>;

    /**
     * Disconnects from the voice channel, this will keep the player alive for use later.
     */
    disconnect(): Promise<void>;

    /**
     * Destroys the player and disconnects it from the voice channel.
     */
    destroy(): Promise<void>;
}
