import { Manager, Query, SearchResult } from "./Manager";
import { Node } from "./Node";
import { Queue } from "./Queue";
import { sizes, State, Structure, TrackUtils, VoiceState } from "./Utils";

export class Player {
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
  public guild: string;
  /** The voice channel for the player. */
  public voiceChannel: string;
  /** The text channel for the player. */
  public textChannel: string;
  /** The current state of the player. */
  public state: State = "DISCONNECTED";
  /** The equalizer bands array. */
  public bands = new Array<number>(15).fill(0.0);
  /** The voice state object from Discord. */
  public voiceState: VoiceState = Object.assign({});
  private readonly player: typeof Player;
  private static manager: Manager;
  private readonly data: Record<string, unknown> = {};

  /**
   * Set custom data.
   * @param key
   * @param value
   */
  public set(key: string, value: unknown): void {
    this.data[key] = value;
  }

  /**
   * Get custom data.
   * @param key
   */
  public get<T>(key: string): T {
    return this.data[key] as T;
  }

  /** @hidden */
  public static init(manager: Manager): void {
    this.manager = manager;
  }

  /**
   * Creates a new player, returns one if it already exists.
   * @param options
   */
  constructor(public options: PlayerOptions) {
    if (!this.player) this.player = Structure.get("Player");
    if (!this.player.manager)
      throw new RangeError("Manager has not been initiated.");

    if (this.player.manager.players.has(options.guild)) {
      return this.player.manager.players.get(options.guild);
    }

    this.volume = options.volume || 100;
    this.guild = options.guild;
    this.voiceChannel = options.voiceChannel;
    this.textChannel = options.textChannel;

    const node = this.player.manager.nodes.get(options.node);
    this.node = node || this.player.manager.leastLoadNodes.first();

    if (!this.node) throw new RangeError("Player() No available nodes.");

    this.player.manager.players.set(options.guild, this);
    this.player.manager.emit("playerCreate", this);
  }

  /**
   * Same as Manager#search() but a shortcut on the player itself.
   * @param query
   * @param requester
   */
  public search(
    query: string | Query,
    requester?: unknown
  ): Promise<SearchResult> {
    return this.player.manager.search(query, requester);
  }

  /**
   * Sets the players equalizer band on-top of the existing ones.
   * @param bands
   */
  public setEQ(...bands: EqualizerBand[]): this {
    for (const { band, gain } of bands) this.bands[band] = gain;

    this.node.send({
      op: "equalizer",
      guildId: this.guild,
      bands: this.bands.map((gain, band) => ({ band, gain })),
    });

    return this;
  }

  /** Clears the equalizer bands. */
  public clearEQ(): this {
    this.bands = new Array(15).fill(0.0);
    return this.setEQ();
  }

  /** Connect to the voice channel. */
  public connect(): this {
    if (!this.voiceChannel)
      throw new RangeError(
        "Player#connect() No voice channel has been set in PlayerOptions."
      );
    this.state = "CONNECTING";

    this.player.manager.options.send(this.guild, {
      op: 4,
      d: {
        guild_id: this.guild,
        channel_id: this.voiceChannel,
        self_mute: this.options.selfMute || false,
        self_deaf: this.options.selfDeaf || false,
      },
    });

    this.state = "CONNECTED";
    return this;
  }

  /** Disconnect from the voice channel. */
  public disconnect(): this | void {
    if (!this.voiceChannel) return undefined;
    this.state = "DISCONNECTING";

    this.pause(true);
    this.player.manager.options.send(this.guild, {
      op: 4,
      d: {
        guild_id: this.guild,
        channel_id: null,
        self_mute: false,
        self_deaf: false,
      },
    });

    this.voiceChannel = null;
    this.state = "DISCONNECTED";
    return this;
  }

  /** Destroys the player. */
  public destroy(): void {
    this.state = "DESTROYING";
    this.disconnect();

    this.node.send({
      op: "destroy",
      guildId: this.guild,
    });

    this.player.manager.emit("playerDestroy", this);
    this.player.manager.players.delete(this.guild);
  }

  /**
   * Sets the player voice channel.
   * @param channel
   */
  public setVoiceChannel(channel: string): this {
    this.voiceChannel = channel;
    this.connect();
    return this;
  }

  /**
   * Sets the player text channel.
   * @param channel
   */
  public setTextChannel(channel: string): this {
    this.textChannel = channel;
    return this;
  }

  /** Plays the next track. */
  public play(): this;

  /**
   * Plays the specified track.
   * @param track
   */
  public play(track: Track): this;

  /**
   * Plays the next track with some options.
   * @param options
   */
  public play(options: PlayOptions): this;

  /**
   * Plays the specified track with some options.
   * @param track
   * @param options
   */
  public play(track: Track, options: PlayOptions): this;
  public play(
    optionsOrTrack?: PlayOptions | Track,
    playOptions?: PlayOptions
  ): this {
    if (
      typeof optionsOrTrack !== "undefined" &&
      TrackUtils.validate(optionsOrTrack)
    ) {
      this.queue.current = optionsOrTrack as Track;
    }

    if (!this.queue.current)
      throw new RangeError("Player#play() No current track.");

    const finalOptions = playOptions
      ? playOptions
      : ["startTime", "endTime", "noReplace"].every((v) =>
          Object.keys(optionsOrTrack || {}).includes(v)
        )
      ? (optionsOrTrack as PlayOptions)
      : {};

    const options = {
      op: "play",
      guildId: this.guild,
      track: this.queue.current.track,
      ...finalOptions,
    };

    if (typeof options.track !== "string") {
      options.track = (options.track as Track).track;
    }

    this.node.send(options);
    return this;
  }

  /**
   * Sets the player volume.
   * @param volume
   */
  public setVolume(volume: number): this {
    if (isNaN(volume))
      throw new RangeError("Player#setVolume() Volume must be a number.");
    this.volume = Math.max(Math.min(volume, 1000), 0);

    this.node.send({
      op: "volume",
      guildId: this.guild,
      volume: this.volume,
    });

    return this;
  }

  /**
   * Sets the track repeat.
   * @param repeat
   */
  public setTrackRepeat(repeat: boolean): this {
    if (typeof repeat !== "boolean")
      throw new RangeError(
        'Player#setTrackRepeat() Repeat can only be "true" or "false".'
      );

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
   * @param repeat
   */
  public setQueueRepeat(repeat: boolean): this {
    if (typeof repeat !== "boolean")
      throw new RangeError(
        'Player#setQueueRepeat() Repeat can only be "true" or "false".'
      );

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
      guildId: this.guild,
    });

    return this;
  }

  /**
   * Pauses the current track.
   * @param pause
   */
  public pause(pause: boolean): this {
    if (typeof pause !== "boolean")
      throw new RangeError(
        'Player#pause() Pause can only be "true" or "false".'
      );

    this.playing = !pause;
    this.paused = pause;
    this.node.send({
      op: "pause",
      guildId: this.guild,
      pause,
    });

    return this;
  }

  /**
   * Seeks to the position in the current track.
   * @param position
   */
  public seek(position: number): this | void {
    if (!this.queue.current) return undefined;
    if (isNaN(position)) {
      throw new RangeError("Player#seek() Position must be a number.");
    }
    if (position < 0 || position > this.queue.current.duration)
      position = Math.max(Math.min(position, this.queue.current.duration), 0);

    this.position = position;
    this.node.send({
      op: "seek",
      guildId: this.guild,
      position,
    });

    return this;
  }
}

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
  /** If the player should deaf itself. */
  selfDeaf?: boolean;
}

export interface Track {
  /** The base64 encoded track. */
  readonly track: string;
  /** The title of the track. */
  readonly title: string;
  /** The identifier of the track. */
  readonly identifier: string;
  /** The author of the track. */
  readonly author: string;
  /** The duration of the track. */
  readonly duration: number;
  /** If the track is seekable. */
  readonly isSeekable: boolean;
  /** If the track is a stream.. */
  readonly isStream: boolean;
  /** The uri of the track. */
  readonly uri: string;
  /** The thumbnail of the track. */
  readonly thumbnail: string;
  /** The user that requested the track. */
  readonly requester: unknown | null;

  /** Displays the track thumbnail with optional size. Only for youtube as others require an API. */
  displayThumbnail(size?: sizes): string;
}

export interface PlayOptions {
  /** The position to start the track. */
  readonly startTime?: number;
  /** The position to end the track. */
  readonly endTime?: number;
  /** Whether to not replace the track if a play payload is sent. */
  readonly noReplace?: boolean;
}

export interface EqualizerBand {
  /** The band number being 0 to 14. */
  band: number;
  /** The gain amount being -0.25 to 1.00, 0.25 being double. */
  gain: number;
}
