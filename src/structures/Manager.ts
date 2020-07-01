/* eslint-disable no-async-promise-executor, @typescript-eslint/no-explicit-any */
import Collection from "@discordjs/collection";
import Axios from "axios";
import { EventEmitter } from "events";
import { Node, NodeOptions } from "./Node";
import { Player, PlayerOptions, Track } from "./Player";
import { buildTrack, LoadType, Plugin, Structure } from "./Utils";

export interface Payload {
  /** The OP code */
  op: number;
  d: {
    guild_id: string;
    channel_id: string | null;
    self_mute: boolean;
    self_deaf: boolean;
  };
}

/** The ManagerOptions interface. */
export interface ManagerOptions {
  /** The array of nodes to connect to. */
  nodes?: NodeOptions[];
  /** The client ID to use. */
  clientId?: string;
  /** The shard count. */
  shards?: number;
  /** A array of plugins to use. */
  plugins?: Plugin[];
  /** Whether players should automatically play the next song. */
  autoPlay?: boolean;
  /**
   * Function to send data to the websocket.
   * @param id The ID of the guild.
   * @param payload The payload to send.
   */
  send(id: string, payload: Payload): void;
}

/** The IQuery interface. */
export interface Query {
  /** The source to search from. */
  source?: "youtube" | "soundcloud";
  /** The query to search for. */
  query: string;
}

/** The SearchResult interface. */
export interface SearchResult {
  /** The load type of the result. */
  loadType: LoadType;
  /** The array of tracks if the load type is SEARCH_RESULT or TRACK_LOADED. */
  tracks?: Track[];
  /** The playlist object if the load type is PLAYLIST_LOADED. */
  playlist?: {
    /** The playlist info object. */
    info: {
      /** The playlist name. */
      name: string;
      /** The playlist selected track. */
      selectedTrack?: Track;
    };
    /** The tracks in the playlist. */
    tracks: Track[];
    /** The duration of the playlist. */
    duration: number;
  };
  /** The exception when searching if one. */
  exception?: {
    /** The message for the exception. */
    message: string;
    /** The severity of exception. */
    severity: string;
  };
}

const template = JSON.stringify(["event", "guildId", "op", "sessionId"]);

export interface Manager {
  /**
   * Emitted when a Node is created.
   * @event Manager#nodeCreate
   */
  on(event: "nodeCreate", listener: (node: Node) => void): this;
  /**
   * Emitted when a Node is destroyed.
   * @event Manager#nodeDestroy
   */
  on(event: "nodeDestroy", listener: (node: Node) => void): this;
  /**
   * Emitted when a Node connects.
   * @event Manager#nodeConnect
   */
  on(event: "nodeConnect", listener: (node: Node) => void): this;
  /**
   * Emitted when a Node reconnects.
   * @event Manager#nodeReconnect
   */
  on(event: "nodeReconnect", listener: (node: Node) => void): this;
  /**
   * Emitted when a Node disconnects.
   * @event Manager#nodeDisconnect
   */
  on(
    event: "nodeDisconnect",
    listener: (node: Node, reason: { code: number; reason: string }) => void
  ): this;
  /**
   * Emitted when a Node has an error.
   * @event Manager#nodeError
   */
  on(event: "nodeError", listener: (node: Node, error: Error) => void): this;
  /**
   * Emitted whenever any Lavalink event is received.
   * @event Manager#nodeRaw
   */
  on(event: "nodeRaw", listener: (payload: any) => void): this;
  /**
   * Emitted when a player is created.
   * @event Manager#playerCreate
   */
  on(event: "playerCreate", listener: (player: Player) => void): this;
  /**
   * Emitted when a player is destroyed.
   * @event Manager#playerDestroy
   */
  on(event: "playerDestroy", listener: (player: Player) => void): this;
  /**
   * Emitted when a player queue ends.
   * @event Manager#queueEnd
   */
  on(event: "queueEnd", listener: (player: Player) => void): this;
  /**
   * Emitted when a player is moved to a new voice channel.
   * @event Manager#playerMove
   */
  on(
    event: "playerMove",
    listener: (player: Player, oldChannel: any, newChannel: string) => void
  ): this;
  /**
   * Emitted when a track starts.
   * @event Manager#trackStart
   */
  on(
    event: "trackStart",
    listener: (player: Player, track: Track, payload: any) => void
  ): this;
  /**
   * Emitted when a track ends.
   * @event Manager#trackEnd
   */
  on(
    event: "trackEnd",
    listener: (player: Player, track: Track, payload: any) => void
  ): this;
  /**
   * Emitted when a track gets stuck during playback.
   * @event Manager#trackStuck
   */
  on(
    event: "trackStuck",
    listener: (player: Player, track: Track, payload: any) => void
  ): this;
  /**
   * Emitted when a track has an error during playback.
   * @event Manager#trackError
   */
  on(
    event: "trackError",
    listener: (player: Player, track: Track, payload: any) => void
  ): this;
  /**
   * Emitted when a voice connect is closed.
   * @event Manager#socketClosed
   */
  on(
    event: "socketClosed",
    listener: (player: Player, payload: any) => void
  ): this;
}

/**
 * The Manager class.
 * @noInheritDoc
 */
export class Manager extends EventEmitter {
  /** The map of players. */
  public readonly players: Collection<string, Player> = new Collection<
    string,
    Player
  >();
  /** The map of nodes. */
  public readonly nodes = new Collection<string, Node>();
  /** The options that were set. */
  public readonly options: ManagerOptions;
  protected readonly voiceStates: Map<string, any> = new Map();

  /**
   * Creates the Manager class.
   * @param {ManagerOptions} options The options to use.
   */
  constructor(options: ManagerOptions) {
    super();

    if (!options.send)
      throw new RangeError("Missing send method in ManageOptions.");

    this.options = {
      plugins: [],
      nodes: [
        {
          host: "localhost",
          port: 2333,
          password: "youshallnotpass",
        },
      ],
      shards: 1,
      autoPlay: false,
      ...options,
    };

    for (const plugin of this.options.plugins) plugin.load(this);

    for (const node of this.options.nodes) {
      const identifier = node.identifier || `${node.host}:${node.port}`;
      this.nodes.set(identifier, new (Structure.get("Node"))(this, node));
    }
  }

  /**
   * Initiates the manager (with a client ID if none provided in ManagerOptions).
   * @param {string} clientId The client ID to use.
   */
  public init(clientId?: string): this {
    if (clientId) this.options.clientId = clientId;
    if (!this.options.clientId) {
      throw new Error(
        '"clientId" is not set. Pass it in Manager#init() or as a option in the constructor.'
      );
    }

    for (const node of this.nodes.values()) node.connect();
    Structure.get("Player").init(this);
    return this;
  }

  /**
   * Searches YouTube with the query.
   * @param {(string|Query)} query The query to search against.
   * @param {any} requester The user who requested the tracks.
   * @returns {Promise<SearchResult>} The search result.
   */
  public search(query: string | Query, requester: any): Promise<SearchResult> {
    return new Promise(async (resolve, reject) => {
      const node: Node = this.nodes
        .filter((node) => node.connected)
        .sort((a, b) => b.calls - a.calls)
        .first();

      if (!node) throw new Error("Manager#search() No available nodes.");

      const source = { soundcloud: "sc" }[(query as Query).source] || "yt";
      let search = (query as Query).query || (query as string);

      if (!/^https?:\/\//.test(search)) {
        search = `${source}search:${search}`;
      }

      const url = `http://${node.options.host}:${node.options.port}/loadtracks`;

      const res = await Axios.get(url, {
        headers: { Authorization: node.options.password },
        params: { identifier: search },
      }).catch((err) => {
        return reject(err);
      });

      node.calls++;

      if (!res || !res.data) {
        return reject(new Error("No data returned from query."));
      }

      const result: SearchResult = {
        loadType: res.data.loadType,
        exception: res.data.exception,
      };

      if (
        [LoadType.SEARCH_RESULT, LoadType.TRACK_LOADED].includes(
          LoadType[result.loadType]
        )
      ) {
        result.tracks = res.data.tracks.map((track) =>
          buildTrack(track, requester)
        );
      } else if (result.loadType === LoadType.PLAYLIST_LOADED) {
        result.playlist = {
          tracks: res.data.tracks.map((track) => buildTrack(track, requester)),
          info: {
            name: res.data.playlistInfo.name,
            selectedTrack: buildTrack(
              res.data.tracks[res.data.playlistInfo.selectedTrack],
              requester
            ),
          },
          duration: res.data.tracks
            .map((track: any) => track.info.length)
            .reduce((acc: number, cur: number) => acc + cur, 0),
        };
      }

      return resolve(result);
    });
  }

  /**
   * Create method for an easier option to creating players.
   * @param {PlayerOptions} options The options to pass.
   */
  public create(options: PlayerOptions): Player {
    if (this.players.has(options.guild.id || options.guild)) {
      return this.players.get(options.guild.id || options.guild);
    } else {
      return new (Structure.get("Player"))(options);
    }
  }

  /**
   * Sends voice data to the Lavalink server.
   * @param {*} data The data to send.
   */
  public updateVoiceState(data: any): void {
    if (
      !data ||
      !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(data.t || "")
    )
      return;
    const player = this.players.get(data.d.guild_id) as Player;

    if (!player) return;
    const state = this.voiceStates.get(data.d.guild_id) || {};

    if (data.t === "VOICE_SERVER_UPDATE") {
      state.op = "voiceUpdate";
      state.guildId = data.d.guild_id;
      state.event = data.d;
    } else {
      if (data.d.user_id !== this.options.clientId) return;
      state.sessionId = data.d.session_id;
      if (player.options.voiceChannel !== data.d.channel_id) {
        this.emit("playerMove", player, player.voiceChannel, data.d.channel_id);
      }
    }

    this.voiceStates.set(data.d.guild_id, state);
    if (JSON.stringify(Object.keys(state).sort()) === template) {
      player.node.send(state);
      this.voiceStates.delete(data.d.guild_id);
    }
  }
}
