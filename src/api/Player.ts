/* eslint-disable no-unused-vars */
import { Manager } from './Manager';
import { Track } from './Track';

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
export interface Player extends PlayerOptions {
    /**
     * The manager.
     */
    readonly manager: Manager

    /**
     * The guild this Player is bound to.
     */
    readonly guild: PlayerOptions['guild'];

    /**
     * The guild text channel this Player is bound to.
     */
    textChannel?: PlayerOptions['textChannel'];

    /**
     * The guild voice channel this Player is bound to and will join.
     */
    voiceChannel?: PlayerOptions['voiceChannel'];

    /**
     * If the player is self-mute itself.
     */
    selfMuted?: PlayerOptions['selfMute'];

    /**
     * If the player is deafen itself.
     */
    selfDeafened?: PlayerOptions['selfDeafen'];

    /**
     * The volume the player is playing at.
     */
    volume?: PlayerOptions['volume'];

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
     * Stops the currently playing track.
     */
    stop(): Promise<void>;

    /**
     * Pauses the currently playing track.
     */
    pause(pause: boolean): Promise<void>;

    /**
     * Seeks to the position in the currently playing track.
     */
    seek(position: number): Promise<void>;

    /**
     * Sets the player volume.
     */
    setVolume(volume: number): Promise<void>;

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
    destroy(disconnect: boolean): Promise<void>;

    /**
     * Plays the specified track.
     * @param track
     */
    play(track: Track): Promise<void>;

    /**
     * Plays the specified track with some options.
     * @param track
     * @param options
     */
    play(track: Track, options: PlayOptions): Promise<void>;
}

export interface PlayOptions {
    /** The position to start the track. */
    readonly startTime?: number;
    /** The position to end the track. */
    readonly endTime?: number;
    /** Whether to not replace the track if a play payload is sent. */
    readonly noReplace?: boolean;
  }