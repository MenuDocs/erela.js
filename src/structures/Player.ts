/* eslint-disable @typescript-eslint/camelcase, @typescript-eslint/no-explicit-any */
import { Structure, State } from "./Utils";
import { Manager } from "./Manager";
import { Queue } from "./Queue";
import { Node } from "./Node";

/** The PlayerOptions interface. */
export interface PlayerOptions {
    /** The guild the Player belongs to. */
    guild: any;
    /** The text channel the Player belongs to. */
    textChannel: any;
    /** The voice channel the Player belongs to. */
    voiceChannel?: any;
    /** The node the Player uses. */
    node?: string;
    /** The initial volume the Player will use. */
    volume?: number;
    /** If the player should mute itself. */
    selfMute?: boolean;
    /** If the player should deafen itself. */
    selfDeafen?: boolean;
}

/** The Track interface. */
export interface Track {
    /** The base64 encoded track. */
    readonly track: string;
    /** The title of the track. */
    readonly title: string;
    /** The identifier of the track. */
    readonly identifier: string;
    /** The author of the track. */
    readonly author: string;
    /** The length of the track. */
    readonly length: number;
    /** If the track is seekable. */
    readonly isSeekable: boolean;
    /** If the track is a stream.. */
    readonly isStream: boolean;
    /** The uri of the track. */
    readonly uri: string;
    /** The thumbnail of the track. */
    readonly thumbnail: string;
    /** The user that requested the track. */
    readonly requester: any;
    /** Displays the track thumbnail with a size in "0", "1", "2", "3", "default", "mqdefault", "hqdefault", "maxresdefault". Only for youtube as others require an API. */
    displayThumbnail(size?: "0" | "1" | "2" | "3" | "default" | "mqdefault" | "hqdefault" | "maxresdefault"): string;
}

/** The PlayOptions interface */
export interface PlayOptions {
    /** The track to play. */
    readonly track?: Track;
    /** The position to start the track. */
    readonly startTime?: number;
    /** The position to end the track. */
    readonly endTime?: number;
    /** Whether to not replace the track if a play payload is sent. */
    readonly noReplace?: boolean;
}

/** The EqualizerBand interface. */
export interface EqualizerBand {
    /** The gain for the band. */
    gain: number;
    /** The band. */
    band: number;
}

/** The Player class. */
export class Player {
    /** The Manager instance. */
    public static manager: Manager;
    /** The Queue for the Player. */
    public readonly queue = new (Structure.get("Queue"))() as Queue;
    /** Whether the queue repeats the track. */
    public trackRepeat = false;
    /** Whether the queue repeats the queue. */
    public queueRepeat = false;
    /** The time the player is in the track. */
    public position = 0;
    /** Whether the player is playing. */
    public playing = false;
    /** Whether the player is paused. */
    public paused = false;
    /** Whether the player is playing. */
    public volume: number;
    /** The Node for the Player. */
    public node: Node;
    /** The guild the player. */
    public guild: any;
    /** The voice channel for the player. */
    public voiceChannel: any;
    /** The text channel for the player. */
    public textChannel: any;
    /** The current state of the player. */
    public state = State.DISCONNECTED;
    /** The equalizer bands array. */
    public bands = new Array<number>(15).fill(0.0);
    private player: typeof Player;

    /** Only for internal use. */
    public static init(manager: Manager): void {
        this.manager = manager;
    }

    /**
     * Creates a new player, returns one if it already exists.
     * @param {PlayerOptions} options The options to pass.
     */
    constructor(public options: PlayerOptions) {
        this.player = Structure.get("Player");
        if (this.player.manager == null) {
            throw new RangeError("Manager has not been initiated.");
        }

        if (this.player.manager.players.has(options.guild.id || options.guild)) {
            return this.player.manager.players.get(options.guild.id || options.guild);
        }

        this.volume = options.volume || 100;
        this.guild = options.guild;
        this.voiceChannel = options.voiceChannel;
        this.textChannel = options.textChannel;

        const node = this.player.manager.nodes.get(options.node);
        this.node =  node || this.player.manager.nodes.values().next().value;

        this.player.manager.players.set(options.guild.id || options.guild, this);
    }

    /**
     * Sets the players equalizer band. Passing nothing will clear it.
     * @param {EqualizerBand[]} bands The bands to set.
     */
    public setEQ(...bands: EqualizerBand[]): this {
        bands.forEach(({ band, gain }) => this.bands[band] = gain)

        this.node.send({
            op: "equalizer",
            guildId: this.guild.id || this.guild,
            bands: this.bands,
        });

        return this;
    }

    /** Clears the equalizer. */
    public clearEQ(): this {
        return this.setEQ(...new Array(15).map((_, i) => ({ band: i, gain: 0.0 })))
    }

    /** Connect to the voice channel. */
    public connect(): this {
        if (!this.voiceChannel) throw new RangeError("Player#connect() No voice channel has been set in PlayerOptions.");
        this.state = State.CONNECTING;

        this.player.manager.options.send(this.guild.id || this.guild, {
            op: 4,
            d: {
              guild_id: this.guild.id || this.guild,
              channel_id: this.voiceChannel.id || this.voiceChannel,
              self_mute: this.options.selfMute || false,
              self_deaf: this.options.selfDeafen || false,
            },
        });

        this.state = State.CONNECTED;
        return this;
    }

    /** Disconnect from the voice channel. */
    public disconnect(): this {
        if (!this.voiceChannel) return;
        this.state = State.DISCONNECTING;

        this.player.manager.options.send(this.guild.id || this.guild, {
            op: 4,
            d: {
                guild_id: this.guild.id || this.guild,
                channel_id: null,
                self_mute: false,
                self_deaf: false,
            },
        });

        this.voiceChannel = null;
        this.textChannel = null;
        this.trackRepeat = false;
        this.queueRepeat = false;
        this.playing = false;
        this.position = 0;

        this.state = State.DISCONNECTED;
        return this;
    }

    /** Destroys the player. */
    public destroy(): void {
        this.state = State.DESTROYING;
        this.disconnect();

        this.node.send({
            op: "destroy",
            guildId: this.guild.id || this.guild,
        });

        this.player.manager.emit("playerDestroy", this);
        this.player.manager.players.delete(this.guild.id || this.guild);
    }

    /**
     * Sets the player voice channel.
     * @param {*} channel The channel to set.
     */
    public setVoiceChannel(channel: any): this {
        channel = this.voiceChannel.id ? channel : channel.id;
        this.voiceChannel = channel;
        this.connect();
        return this;
    }

    /**
     * Sets the player text channel.
     * @param {*} channel The channel to set.
     */
    public setTextChannel(channel: any): this {
        channel = this.textChannel.id ? channel : channel.id;
        this.textChannel = channel;
        return this;
    }

    /**
     * Plays the next track or a specified track in the PlayOptions.
     * @param {PlayOptions} [options={}] The options to use.
     */
    public play(options: PlayOptions = {}): this {
        if (!this.queue[0]) throw new RangeError("Player#play() No tracks in the queue.");

        const finalOptions = {
            op: "play",
            guildId: this.guild.id || this.guild,
            track: this.queue[0].track,
            ...options,
        };

        if (typeof finalOptions.track !== "string") {
            finalOptions.track = (finalOptions.track as Track).track;
        }

        this.node.send(finalOptions);
        return this;
    }

    /**
     * Sets the player volume.
     * @param {number} volume The volume to set.
     */
    public setVolume(volume: number): this {
        if (isNaN(volume)) throw new RangeError("Player#setVolume() Volume must be a number.");
        this.volume = Math.max(Math.min(volume, 1000), 0);

        this.node.send({
            op: "volume",
            guildId: this.guild.id || this.guild,
            volume: this.volume,
        });

        return this;
    }

    /**
     * Sets the track repeat.
     * @param {boolean} repeat If track repeat should be enabled.
     */
    public setTrackRepeat(repeat: boolean): this {
        if (typeof repeat !== "boolean") throw new RangeError("Player#setTrackRepeat() Repeat can only be \"true\" or \"false\".");

        if (repeat) {
            this.trackRepeat = true;
            this.queueRepeat = false;
        } else {
            this.trackRepeat = false;
            this.queueRepeat = false;
        }

        return this;
    }

    /**
     * Sets the queue repeat.
     * @param {boolean} repeat If queue repeat should be enabled.
     */
    public setQueueRepeat(repeat: boolean): this {
        if (typeof repeat !== "boolean") throw new RangeError("Player#setQueueRepeat() Repeat can only be \"true\" or \"false\".");
        
        if (repeat) {
            this.trackRepeat = false;
            this.queueRepeat = true;
        } else {
            this.trackRepeat = false;
            this.queueRepeat = false;
        }

        return this;
    }

    /** Stops the current track. */
    public stop(): this {
        this.node.send({
            op: "stop",
            guildId: this.guild.id || this.guild,
        });

        return this;
    }

    /**
     * Pauses the current track.
     * @param {boolean} pause Whether to pause the current track.
     */
    public pause(pause: boolean): this {
        if (typeof pause !== "boolean") throw new RangeError("Player#pause() Pause can only be \"true\" or \"false\".");

        this.playing = !pause;
        this.paused = pause;
        this.node.send({
            op: "pause",
            guildId: this.guild.id || this.guild,
            pause,
        });

        return this;
    }

    /**
     * Seeks to the position in the current track.
     * @param {boolean} pause Whether to pause the current track.
     */
    public seek(position: number): this {
        if (!this.queue[0]) return;
        if (isNaN(position)) { throw new RangeError("Player#seek() Position must be a number."); }
        if (position < 0 || position > this.queue[0].length) position = Math.max(Math.min(position, this.queue[0].length), 0);

        this.position = position;
        this.node.send({
            op: "seek",
            guildId: this.guild.id || this.guild,
            position,
        });

        return this;
    }
}
