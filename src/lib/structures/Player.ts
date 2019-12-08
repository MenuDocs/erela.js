import { Guild, TextChannel, VoiceChannel, Collection } from "discord.js";
import { ErelaClient, IPlayerOptions } from "../ErelaClient";
import { Node } from "./Node";
import { IQueue, Queue } from "./Queue";

/**
 * The IEqualizerBand interface.
 * @export
 * @interface IEqualizerBand
 */
export interface IEqualizerBand {
    band: number;
    gain: number;
}

/**
 * The IPlayerVoiceUpdate interface.
 * @export
 * @interface IPlayerVoiceUpdate
 */
export interface IPlayerVoiceUpdate {
    sessionId?: string;
    event?: {
        token: string;
        guild_id: string;
        endpoint: string;
    };
}

/**
 * The IPlayerVoiceStateUpdate interface.
 * @export
 * @interface IPlayerVoiceStateUpdate
 */
export interface IPlayerVoiceStateUpdate {
    readonly time: number;
    readonly position?: number;
    readonly volume: number;
    readonly equalizer: IEqualizerBand[];
}

/**
 * The IPlayer interface.
 * @export
 * @interface IPlayer
 */
export interface IPlayer {
    readonly erela: ErelaClient;
    readonly node: Node;
    readonly options: IPlayerOptions;
    readonly guild: Guild;
    readonly textChannel: TextChannel;
    voiceChannel: VoiceChannel;
    bands: IEqualizerBand[];
    readonly queue: IQueue;
    playing: boolean;
    position: number;
    positionTimestamp: number;
    volume: number;
    trackRepeat: boolean;
    queueRepeat: boolean;

    updateState(data: IPlayerVoiceStateUpdate): void;
    play(): void;
    stop(): void;
    pause(pause: boolean): void;
    seek(position: number): void;
    setVolume(volume: number): void;
    setTrackRepeat(repeat: boolean): void;
    setQueueRepeat(repeat: boolean): void;
}

/**
 * The Player class.
 * @export
 * @class Player
 * @implements {IPlayer}
 */
export class Player implements IPlayer {
    public readonly erela: ErelaClient;
    public readonly node: Node;
    public readonly options: IPlayerOptions;
    public readonly guild: Guild;
    public readonly textChannel: TextChannel;
    public voiceChannel: VoiceChannel;
    public bands: IEqualizerBand[];
    public readonly queue: IQueue;
    public playing: boolean;
    public position: number;
    public positionTimestamp: number;
    public volume: number;
    public trackRepeat: boolean;
    public queueRepeat: boolean;

    /**
     * Creates an instance of Player.
     * @param {ErelaClient} erela - The Erela client.
     * @param {Node} node - The Erela Node.
     * @param {PlayerOptions} options - The player options.
     * @param {Object} extra - Extra data to pass when extending for custom classes.
     * @memberof Player
     */
    public constructor(erela: ErelaClient, node: Node, options: IPlayerOptions, extra: object) {
        this.erela = erela;
        this.node = node;
        this.options = options;
        this.guild = options.guild;
        this.textChannel = options.textChannel;
        this.voiceChannel = options.voiceChannel;
        this.bands = [...new Array(14)].map((_, i) => JSON.parse(`{"band": ${i}, "gain": 0.0}`));
        this.queue = new Queue(erela);
        this.playing = false;
        this.position = 0;
        this.positionTimestamp = 0;
        this.volume = 100;
        this.trackRepeat = false;
        this.queueRepeat = false;
    }

    /**
     * Plays the next track in the queue.
     * @memberof Player
     */
    public play(): void {
        if (this.queue[0]) {
            this.playing = true;
            this.node.send({
                op: "play",
                guildId: this.guild.id,
                track: this.queue[0].track,
            });
            this.erela.emit("trackStart", this, this.queue[0]);
        }
    }

    /**
     * Sets the players volume.
     * @param {number} volume - The volume to set.
     * @memberof Player
     */
    public setVolume(volume: number): void {
        if (isNaN(volume)) {
            throw new RangeError("Player#setVolume(volume: number) Volume must be a number");
        }
        if (volume <= 0 || volume > 100) {
            throw new RangeError("Player#setVolume(volume: number) Volume can not be lower than 1 or higher than 100, must be or be between 1 and 100.");
        }
        this.volume = volume;
        this.node.send({
            op: "volume",
            guildId: this.guild.id,
            volume,
        });
    }

    /**
     * Sets the players equalizer. Pass a empty array to reset the bands.
     * @param {Array<EqualizerBand>} bands - The array of bands to set.
     * @memberof Player
     */
    public setEQ(bands: IEqualizerBand[]): void {
        if (!bands || !Array.isArray(bands)) {
            throw new RangeError("Player#setEQ(bands: IEqualizerBand[]) Bands must be a array of bands.");
        }
        if (bands.length === 0) {
            this.bands.map((v, i) => this.bands[i].gain = 0.0);
        } else {
            bands.forEach((band) => this.bands[band.band].gain = band.gain);
        }
        this.node.send({
            op: "equalizer",
            guildId: this.guild.id,
            bands: this.bands.map((band) => band),
        });
    }

    /**
     * Sets the track repeat.
     * @param {boolean} repeat - If track repeat should be enabled.
     * @memberof Player
     */
    public setTrackRepeat(repeat: boolean): void {
        if (typeof repeat !== "boolean") { throw new RangeError("Player#setTrackRepeat(repeat: boolean) Repeat can only be \"true\" or \"false\"."); }
        if (repeat) {
            this.trackRepeat = true;
            this.queueRepeat = false;
        } else {
            this.trackRepeat = false;
            this.queueRepeat = false;
        }
    }

    /**
     * Sets the queue repeat.
     * @param {boolean} repeat - If queue repeat should be enabled.
     * @memberof Player
     */
    public setQueueRepeat(repeat: boolean): void {
        if (typeof repeat !== "boolean") { throw new RangeError("Player#setQueueRepeat(repeat: boolean) Repeat can only be \"true\" or \"false\"."); }
        if (repeat) {
            this.trackRepeat = false;
            this.queueRepeat = true;
        } else {
            this.trackRepeat = false;
            this.queueRepeat = false;
        }
    }

    /**
     * Updates the player state.
     * @param {IPlayerVoiceStateUpdate} data - The data to pass;
     * @memberof Player
     */
    public updateState(data: IPlayerVoiceStateUpdate): void {
        this.position = data.position || 0;
        this.positionTimestamp = data.time;
    }

    /**
     * Stops the current track.
     * @memberof Player
     */
    public stop(): void {
        this.node.send({
            op: "stop",
            guildId: this.guild.id,
        });
    }

    /**
     * Pauses the current track.
     * @param {boolean} pause - Whether to pause the current track.
     * @memberof Player
     */
    public pause(pause: boolean): void {
        if (typeof pause !== "boolean") { throw new RangeError("Player#pause(pause: boolean) Pause can only be \"true\" or \"false\"."); }
        this.playing = !pause;
        this.node.send({
            op: "pause",
            guildId: this.guild.id,
            pause,
        });
    }

    /**
     * Seeks to the position in the current track.
     * @param {boolean} pause - Whether to pause the current track.
     * @memberof Player
     */
    public seek(position: number): void {
        if (!this.queue[0]) { throw new RangeError("Player#seek(position: number) Can only seek when theres a track in the queue."); }
        if (isNaN(position)) { throw new RangeError("Player#seek(position: number) Position must be a number."); }
        if (position < 0 || position > this.queue[0].duration) { throw new RangeError(`Player#seek(position: number) Position can not be smaller than 0 or bigger than ${this.queue[0].duration}.`); }
        this.position = position;
        this.node.send({
            op: "seek",
            guildId: this.guild.id,
            position,
        });
    }
}
