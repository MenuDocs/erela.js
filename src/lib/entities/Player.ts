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
     * @param {ErelaClient} erela - The Erela client.
     * @param {Node} node - The Erela Node.
     * @param {IPlayerOptions} options - The player options.
     * @param {any} extra - Extra data to pass when extending for custom classes.
     */
    public constructor(erela: ErelaClient, node: Node, options: IPlayerOptions, extra: any) {
        this.erela = erela;
        this.node = node;
        this.options = options;
        this.guild = options.guild;
        this.textChannel = options.textChannel;
        this.voiceChannel = options.voiceChannel;
        this.queue = new Queue(erela);
        this.volume = options.volume || 100;
    }

    /**
     * Changes the player's voice channel.
     * @param {*} channel - The new voice channel to join.
     * @memberof Player
     */
    public setVoiceChannel(channel: any) {
        if (this.erela.library) {
            if (typeof channel === "undefined") {
                throw new RangeError("Player#setVoiceChannel(channel: any) Channel must be a voice channel.");
            }

            const guild = this.erela.library.findGuild(this.erela.client, this.guild.id || this.guild);

            if (!this.erela.library.findGuildChannel(guild, channel.id || channel)) {
                // tslint:disable-next-line: max-line-length
                throw new RangeError("Player#setVoiceChannel(channel: any) Cannot bind to a channel not in this guild.");
            }
        }

        this.voiceChannel = channel;
        this.erela.sendWS({
            op: 4,
            d: {
                guild_id: this.guild.id || this.guild,
                channel_id: this.voiceChannel.id || this.voiceChannel,
                self_mute: this.options.selfMute || false,
                self_deaf: this.options.selfDeaf || false,
            },
        });
    }

    /**
     * Changes the player's text channel.
     * @param {*} channel - The new text channel to send messages in.
     * @memberof Player
     */
    public setTextChannel(channel: any) {
        if (this.erela.library) {
            if (typeof channel === "undefined") {
                throw new RangeError("Player#setTextChannel(channel: any) Channel must be a text channel.");
            }

            const guild = this.erela.library.findGuild(this.erela.client, this.guild.id || this.guild);

            if (!this.erela.library.findGuildChannel(guild, channel.id || channel)) {
                throw new RangeError("Player#setTextChannel(channel: any) Cannot bind to a channel not in this guild.");
            }
        }

        this.textChannel = channel;
    }

    /**
     * Plays the next track in the queue.
     */
    public play(): void {
        if (!this.queue[0]) {
            throw new RangeError("Player#play() No tracks in the queue.");
        }
        this.playing = true;
        this.node.send({
            op: "play",
            guildId: this.guild.id || this.guild,
            track: this.queue[0].track,
            volume: this.volume,
        });
        this.erela.emit("trackStart", this, this.queue[0]);
    }

    /**
     * Sets the players volume.
     * @param {number} volume - The volume to set.
     */
    public setVolume(volume: number): void {
        if (isNaN(volume)) {
            throw new RangeError("Player#setVolume(volume: number) Volume must be a number");
        }
        if (volume < 0 || volume > 1000) {
            throw new RangeError("Player#setVolume(volume: number) Volume can not be lower than 0 or higher than 1000, must be or be between 0 and 1000.");
        }
        this.volume = volume;
        this.node.send({
            op: "volume",
            guildId: this.guild.id || this.guild,
            volume,
        });
    }

    /**
     * Sets the players equalizer. Pass a empty array to reset the bands.
     * @param {Array<EqualizerBand>} bands - The array of bands to set.
     * @example
     * player.setEQ([
     *      { band: 0, gain: 0.15 },
     *      { band: 1, gain: 0.15 },
     *      { band: 2, gain: 0.15 }
     * ]);
     */
    public setEQ(bands: IEqualizerBand[]): void {
        if (!Array.isArray(bands)) {
            throw new RangeError("Player#setEQ(bands: IEqualizerBand[]) Bands must be a array of bands.");
        }

        if (bands.length === 0) {
            this.bands.map((v, i) => this.bands[i].gain = 0.0);
        } else {
            bands.forEach(({ band, gain }) => this.bands[band].gain = gain);
        }

        this.node.send({
            op: "equalizer",
            guildId: this.guild.id || this.guild,
            bands: this.bands.map((band) => band),
        });
    }

    /**
     * Sets the track repeat.
     * @param {boolean} repeat - If track repeat should be enabled.
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
     * Stops the current track.
     */
    public stop(): void {
        this.node.send({
            op: "stop",
            guildId: this.guild.id || this.guild,
        });
    }

    /**
     * Pauses the current track.
     * @param {boolean} pause - Whether to pause the current track.
     */
    public pause(pause: boolean): void {
        if (typeof pause !== "boolean") { throw new RangeError("Player#pause(pause: boolean) Pause can only be \"true\" or \"false\"."); }
        this.playing = !pause;
        this.node.send({
            op: "pause",
            guildId: this.guild.id || this.guild,
            pause,
        });
    }

    /**
     * Seeks to the position in the current track.
     * @param {boolean} pause - Whether to pause the current track.
     */
    public seek(position: number): void {
        if (!this.queue[0]) { throw new RangeError("Player#seek(position: number) Can only seek when theres a track in the queue."); }
        if (isNaN(position)) { throw new RangeError("Player#seek(position: number) Position must be a number."); }
        if (position < 0 || position > this.queue[0].duration) { throw new RangeError(`Player#seek(position: number) Position can not be smaller than 0 or bigger than ${this.queue[0].duration}.`); }
        this.position = position;
        this.node.send({
            op: "seek",
            guildId: this.guild.id || this.guild,
            position,
        });
    }
}
