import { ErelaClient } from "../ErelaClient";
import { Node } from "./Node";
import { Queue } from "./Queue";
import _ from "lodash";

/**
 * The IPlayerOptions interface.
 */
export interface IPlayerOptions {
    /**
     * The guild to connect to.
     */
    guild: any;
    /**
     * The text channel to connect to.
     */
    textChannel: any;
    /**
     * The voice channel to connect to.
     */
    voiceChannel: any;
    /**
     * Whether to deafen the client.
     */
    selfDeaf?: boolean;
    /**
     * Whether to mute the client.
     */
    selfMute?: boolean;
    /**
     * The volume to set the player at.
     */
    volume?: number;
}

/**
 * The IEqualizerBand interface.
 */
export interface IEqualizerBand {
    /**
     * The band for the equalizer band.
     */
    band: number;
    /**
     * The gain for the equalizer band.
     */
    gain: number;
}

export interface IPlayOptions {
    /**
     * The position to start the track.
     */
    readonly startTime?: number;
    /**
     * The position to end the track.
     */
    readonly endTime?: number;
    /**
     * Whether to not replace the track if a play playload is sent.
     */
    readonly noReplace?: boolean;
}

/**
 * The Player class.
 */
export class Player {
    public readonly erela: ErelaClient;
    /**
     * The players node.
     */
    public readonly node: Node;
    /**
     * The players options.
     */
    public readonly options: IPlayerOptions;
    /**
     * The players guild it's connected to.
     */
    public readonly guild: any;
    /**
     * The players text channel it's connected to.
     */
    public textChannel: any;
    /**
     * The players voice channel it's connected to.
     */
    public voiceChannel: any;
    /**
     * The players equalizer bands.
     */
    public bands: IEqualizerBand[] = [...new Array(14)].map((__, i) => JSON.parse(`{"band": ${i}, "gain": 0.0}`));
    /**
     * The players queue.
     */
    public readonly queue: Queue;
    /**
     * The players current volume.
     */
    public volume: number;
    /**
     * Whether the player is playing.
     */
    public playing: boolean = false;
    /**
     * The players current position in the track.
     */
    public position: number = 0;
    /**
     * Whether the player is repeating the current track.
     */
    public trackRepeat: boolean = false;
    /**
     * Whether the player is repeating the queue.
     */
    public queueRepeat: boolean = false;

    /**
     * Creates an instance of Player.
     * @param {ErelaClient} erela The Erela client.
     * @param {Node} node The Erela Node.
     * @param {IPlayerOptions} options The player options.
     */
    public constructor(erela: ErelaClient, node: Node, options: IPlayerOptions) {
        this.erela = erela;
        this.node = node;
        this.options = options;
        this.guild = options.guild;
        this.textChannel = options.textChannel;
        this.voiceChannel = options.voiceChannel;
        const clazz = this.erela.classes.get("Queue");
        this.queue = new clazz(erela);
        this.volume = options.volume || 100;
    }

    /**
     * Plays the next track in the queue.
     * @param {IPlayOptions} [options={}] The options to send when playing a track.
     */
    public play(options: IPlayOptions = {}): void {
        if (!this.queue[0]) {
            throw new RangeError("Player#play() No tracks in the queue.");
        }

        this.playing = true;
        this.node.send({
            op: "play",
            guildId: this.guild,
            track: this.queue[0].track,
            ...options,
        });

        this.erela.emit("trackStart", this, this.queue[0]);
    }

    /**
     * Sets the players volume.
     * @param {number} volume The volume to set.
     */
    public setVolume(volume: number): void {
        if (isNaN(volume)) {
            throw new RangeError("Player#setVolume(volume: number) Volume must be a number");
        } else if (volume < 0 || volume > 1000) {
            throw new RangeError("Player#setVolume(volume: number) Volume must be or be between 0 and 1000.");
        }

        this.volume = volume;
        this.node.send({
            op: "volume",
            guildId: this.guild,
            volume,
        });
    }

    /**
     * Sets the players equalizer. Pass a empty array to reset the bands.
     * @param {EqualizerBand[]} bands The array of bands to set.
     * @example
     * player.setEQ([
     *      { band: 0, gain: 0.15 },
     *      { band: 1, gain: 0.15 },
     *      { band: 2, gain: 0.15 }
     * ]);
     */
    public setEQ(bands: IEqualizerBand[]): void {
        if (!Array.isArray(bands)) {
            throw new RangeError("Player#setEQ(bands: IEqualizerBand[]) Bands must be an array of bands.");
        }

        if (bands.length === 0) {
            this.bands.map((v, i) => this.bands[i].gain = 0.0);
        } else {
            bands.forEach(({ band, gain }) => this.bands[band].gain = gain);
        }

        this.node.send({
            op: "equalizer",
            guildId: this.guild,
            bands: this.bands.map((band) => band),
        });
    }

    /**
     * Sets the track repeat.
     * @param {boolean} repeat If track repeat should be enabled.
     */
    public setTrackRepeat(repeat: boolean): void {
        if (typeof repeat !== "boolean") {
            throw new RangeError("Player#setTrackRepeat(repeat: boolean) Repeat must be a boolean.");
        }

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
     * @param {boolean} repeat If queue repeat should be enabled.
     */
    public setQueueRepeat(repeat: boolean): void {
        if (typeof repeat !== "boolean") {
            throw new RangeError("Player#setQueueRepeat(repeat: boolean) Repeat must be a boolean.");
        }

        if (repeat) {
            this.trackRepeat = false;
            this.queueRepeat = true;
        } else {
            this.trackRepeat = false;
            this.queueRepeat = false;
        }
    }

    /**
     * Stops the current track.
     */
    public stop(): void {
        this.node.send({
            op: "stop",
            guildId: this.guild,
        });
    }

    /**
     * Pauses the current track.
     * @param {boolean} pause Whether to pause the current track.
     */
    public pause(pause: boolean): void {
        if (typeof pause !== "boolean") {
            throw new RangeError("Player#pause(pause: boolean) Pause must be a boolean.");
        }

        this.playing = !pause;
        this.node.send({
            op: "pause",
            guildId: this.guild,
            pause,
        });
    }

    /**
     * Seeks to the position in the current track.
     * @param {boolean} pause Whether to pause the current track.
     */
    public seek(position: number): void {
        if (!this.queue[0]) {
            throw new RangeError("Player#seek(position: number) Can only seek when theres a track in the queue.");
        } else if (isNaN(position)) {
            throw new RangeError("Player#seek(position: number) Position must be a number.");
        } else if (position < 0 || position > this.queue[0].duration) {
            throw new RangeError(`Player#seek(position: number) Position can not be smaller than 0 or bigger than ${this.queue[0].duration}.`);
        }

        this.position = position;
        this.node.send({
            op: "seek",
            guildId: this.guild,
            position,
        });
    }

    /**
     * Destroys the player.
     */
    public destroy(): void {
        this.erela.players.destroy(this.guild);
    }
}
