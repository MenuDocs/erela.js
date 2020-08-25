/* eslint-disable no-async-promise-executor, @typescript-eslint/no-explicit-any, no-undef */
import Collection from "@discordjs/collection";
import Axios from "axios";
import { EventEmitter } from "events";
import { Node, NodeOptions } from "./Node";
import { Player, PlayerOptions, Track } from "./Player";
import {
  LoadType,
  Plugin,
  Structure,
  TrackData,
  TrackEndEvent,
  TrackExceptionEvent,
  TrackStartEvent,
  TrackStuckEvent,
  TrackUtils,
  VoicePacket,
  WebSocketClosedEvent
} from "./Utils";

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
    listener: (node: Node, reason: { code?: number; reason?: string }) => void
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
  on(event: "nodeRaw", listener: (payload: unknown) => void): this;

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
    listener: (player: Player, oldChannel: string, newChannel: string) => void
  ): this;

  /**
   * Emitted when a track starts.
   * @event Manager#trackStart
   */
  on(
    event: "trackStart",
    listener: (player: Player, track: Track, payload: TrackStartEvent) => void
  ): this;

  /**
   * Emitted when a track ends.
   * @event Manager#trackEnd
   */
  on(
    event: "trackEnd",
    listener: (player: Player, track: Track, payload: TrackEndEvent) => void
  ): this;

  /**
   * Emitted when a track gets stuck during playback.
   * @event Manager#trackStuck
   */
  on(
    event: "trackStuck",
    listener: (player: Player, track: Track, payload: TrackStuckEvent) => void
  ): this;

  /**
   * Emitted when a track has an error during playback.
   * @event Manager#trackError
   */
  on(
    event: "trackError",
    listener: (player: Player, track: Track, payload: TrackExceptionEvent) => void
  ): this;

  /**
   * Emitted when a voice connection is closed.
   * @event Manager#socketClosed
   */
  on(
    event: "socketClosed",
    listener: (player: Player, payload: WebSocketClosedEvent) => void
  ): this;
}

/** @noInheritDoc */
export class Manager extends EventEmitter {
  /** The map of players. */
  public readonly players: Collection<string, Player> = new Collection<string, Player>();
  /** The map of nodes. */
  public readonly nodes = new Collection<string, Node>();
  /** The options that were set. */
  public readonly options: ManagerOptions;

  /** Returns the least used Nodes. */
  public get leastUsedNodes(): Collection<string, Node> {
    return this.nodes
      .filter((node) => node.connected)
      .sort((a, b) => b.calls - a.calls);
  }

  /** Returns the least system load Nodes. */
  public get leastLoadNodes(): Collection<string, Node> {
    return this.nodes
      .filter((node) => node.connected)
      .sort((a, b) => {
        const aload = a.stats.cpu
          ? (a.stats.cpu.systemLoad / a.stats.cpu.cores) * 100
          : 0;
        const bload = b.stats.cpu
          ? (b.stats.cpu.systemLoad / b.stats.cpu.cores) * 100
          : 0;
        return aload - bload;
      })
  }

  /**
   * Initiates the Manager class.
   * @param options
   */
  constructor(options: ManagerOptions) {
    super();

    if (!options.send)
      throw new RangeError("Missing send method in ManageOptions.");

    if (!options.clientId) {
      throw new Error(
        '"clientId" is not set. Pass it in Manager#init() or as a option in the constructor.'
      );
    }

    this.options = {
      plugins: [],
      nodes: [{ host: "localhost" }],
      shards: 1,
      autoPlay: false,
      ...options,
    };

    for (const plugin of this.options.plugins) plugin.load(this);

    for (const nodeOptions of this.options.nodes) {
      const node = new (Structure.get("Node"))(this, nodeOptions)
      this.nodes.set(node.options.identifier, node);
      node.connect();
    }

    Structure.get("Player").init(this);
  }

  /**
   * Searches the enabled sources based off the url or the source property.
   * @param query
   * @param requester
   * @returns The search result.
   */
  public search(query: string | Query, requester?: unknown): Promise<SearchResult> {
    return new Promise(async (resolve, reject) => {
      const node: Node = this.leastUsedNodes.first()
      if (!node) throw new Error("Manager#search() No available nodes.");

      const source = { soundcloud: "sc" }[(query as Query).source] || "yt";
      let search = (query as Query).query || (query as string);

      if (!/^https?:\/\//.test(search)) {
        search = `${source}search:${search}`;
      }

      const url = `http${node.options.secure ? "s" : ""}://${node.options.host}:${node.options.port}/loadtracks`;

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
        tracks: res.data.tracks.map((track) => TrackUtils.build(track, requester)),
      };

      if (
        ["SEARCH_RESULT", "TRACK_LOADED"].includes(
          result.loadType
        )
      ) {
        result.tracks = res.data.tracks.map((track) =>
          TrackUtils.build(track, requester)
        );
      } else if (result.loadType === "PLAYLIST_LOADED") {
        result.playlist = {
          name: res.data.playlistInfo.name,
          selectedTrack: TrackUtils.build(
            res.data.tracks[res.data.playlistInfo.selectedTrack],
            requester
          ),
          duration: res.data.tracks
            .map((track: TrackData) => track.info.length)
            .reduce((acc: number, cur: number) => acc + cur, 0),
        };
      }

      return resolve(result);
    });
  }

  /**
   * Decodes the base64 encoded track and returns a TrackData.
   * @param track
   */
  public decodeTrack(track: string): Promise<TrackData> {
    return new Promise(async (resolve, reject) => {
      const node: Node = this.leastUsedNodes.first()
      if (!node) throw new Error("Manager#search() No available nodes.");
      const url = `http${node.options.secure ? "s" : ""}://${node.options.host}:${node.options.port}/decodetrack`;

      const res = await Axios.get(url, {
        headers: { Authorization: node.options.password },
        params: { track: track },
      }).catch((err) => {
        return reject(err);
      });

      node.calls++;

      if (!res || !res.data) {
        return reject(new Error("No data returned from query."));
      }

      return resolve({ track, info: res.data })
    })
  }

  /**
   * Creates a player or returns one if it already exists.
   * @param options
   */
  public create(options: PlayerOptions): Player {
    if (this.players.has(options.guild)) {
      return this.players.get(options.guild);
    } else {
      return new (Structure.get("Player"))(options);
    }
  }

  /**
   * Sends voice data to the Lavalink server.
   * @param data
   */
  public updateVoiceState(data: VoicePacket): void {
    if (
      !data ||
      !["VOICE_SERVER_UPDATE", "VOICE_STATE_UPDATE"].includes(data.t || "")
    )
      return;
    const player = this.players.get(data.d.guild_id) as Player;

    if (!player) return;
    const state = player.voiceState;

    if (data.t === "VOICE_SERVER_UPDATE") {
      state.op = "voiceUpdate";
      state.guildId = data.d.guild_id;
      state.event = data.d;
    } else {
      if (data.d.user_id !== this.options.clientId) return;
      state.sessionId = data.d.session_id;
      if (player.voiceChannel !== data.d.channel_id) {
        this.emit("playerMove", player, player.voiceChannel, data.d.channel_id);
        player.voiceChannel = data.d.channel_id
      }
    }

    player.voiceState = state;
    if (JSON.stringify(Object.keys(state).sort()) === template) player.node.send(state);
  }
}

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

export interface ManagerOptions {
  /** The array of nodes to connect to. */
  nodes?: NodeOptions[];
  /** The client ID to use. */
  clientId: string;
  /** The shard count. */
  shards?: number;
  /** A array of plugins to use. */
  plugins?: Plugin[];
  /** Whether players should automatically play the next song. */
  autoPlay?: boolean;

  /**
   * Function to send data to the websocket.
   * @param id
   * @param payload
   */
  send(id: string, payload: Payload): void;
}

export interface Query {
  /** The source to search from. */
  source?: "youtube" | "soundcloud";
  /** The query to search for. */
  query: string;
}

export interface SearchResult {
  /** The load type of the result. */
  loadType: LoadType;
  /** The array of tracks. */
  tracks?: Track[];
  /** The playlist object if the load type is PLAYLIST_LOADED. */
  playlist?: PlaylistInfo;
  /** The exception when searching if one. */
  exception?: {
    /** The message for the exception. */
    message: string;
    /** The severity of exception. */
    severity: string;
  };
}

export interface PlaylistInfo {
  /** The playlist name. */
  name: string;
  /** The playlist selected track. */
  selectedTrack?: Track;
  /** The duration of the playlist. */
  duration: number;
}