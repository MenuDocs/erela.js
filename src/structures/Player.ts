// tslint:disable: member-ordering max-line-length
import { Structure, mix } from "./Utils";
import { EventEmitter } from "events";
import { Manager } from "./Manager";
import { Queue } from "./Queue";
import { Node } from "./Node";

/** The PlayerOptions interface. */
export interface PlayerOptions {
    /** The guild the Player belongs to. */
    guild: string;
    /** The text channel the Player belongs to. */
    textChannel: string;
    /** The voice channel the Player belongs to. */
    voiceChannel?: string;
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
    readonly user: any;
    /** Displays the track thumbnail with a size in "0", "1", "2", "3", "default", "mqdefault", "hqdefault", "maxresdefault". Only for youtube as others require an API. */
    displayThumbnail(size?: string): string;
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

export interface Player extends Structure, EventEmitter {}

/** The Player class. */
export class Player {
    /** The Manager. */
    public static manager: Manager | null;
    /** The Queue for the Player. */
    public readonly queue = new Queue();
    /** The Node for the Player. */
    public node: Node;
    /** Whether the queue repeats the track. */
    public trackRepeat: boolean;
    /** Whether the queue repeats the queue. */
    public queueRepeat: boolean;
    /** The time the player is in the track. */
    public position: number;
    /** Whether the player is playing. */
    public playing: boolean;

    public static init(manager: Manager): void {
        this.manager = manager;
    }

    public get connected() {
        return this.options.voiceChannel !== undefined;
    }

    /**
     * Creates a new player, returns one if it already exists.
     * @param {PlayerOptions} options The options to pass.
     */
    constructor(public options: PlayerOptions) {
        if (Player.manager == null) {
            throw new RangeError("Manager has not been initiated.");
        }

        if (Player.manager.players.has(options.guild)) {
            return Player.manager.players.get(options.guild);
        }

        const node = Player.manager.nodes.get(options.node);
        this.node =  node || Player.manager.nodes.values().next().value;
        Player.manager.players.set(options.guild, this);
    }

    /**
     * Connect to the voice channel. Will use the voice channel set in PlayerOptions.
     * @param {string} [voiceChannel=null] The voice channel to join.
     */
    public connect(voiceChannel: string = null) {
        if (voiceChannel != null) this.options.voiceChannel = voiceChannel;
        if (this.options.voiceChannel === undefined) {
            throw new RangeError("No voice channel has been set in PlayerOptions or in the connect method.");
        }

        Player.manager.options.send(this.options.guild, {
            op: 4,
            d: {
              guild_id: this.options.guild,
              channel_id: this.options.voiceChannel,
              self_mute: false,
              self_deaf: false,
            },
        });
    }

    public play(options: PlayOptions = {}) {
        if (!this.queue[0]) {
            throw new RangeError("Player#play() No tracks in the queue.");
        }

        const finalOptions = {
            op: "play",
            guildId: this.options.guild,
            track: this.queue[0].track,
            ...options,
        };

        if (typeof finalOptions.track !== "string") {
            finalOptions.track = (finalOptions.track as Track).track;
        }

        this.node.send(finalOptions);
    }
}

mix(Player, Structure, EventEmitter);
