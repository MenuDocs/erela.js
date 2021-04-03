/* eslint-disable no-async-promise-executor */
import Collection from "@discordjs/collection";
import { EventEmitter } from "events";
import { Node, NodeOptions } from "./Node";
import { Player, PlayerOptions, Track, UnresolvedTrack } from "./Player";
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
  WebSocketClosedEvent,
} from "./Utils";

const TEMPLATE = JSON.stringify(["event", "guildId", "op", "sessionId"]);

function check(options: ManagerOptions) {
  if (!options) throw new TypeError("ManagerOptions must not be empty.");

  if (typeof options.send !== "function")
    throw new TypeError('Manager option "send" must be present and a function.');

  if (
    typeof options.clientId !== "undefined" &&
    !/^\d+$/.test(options.clientId)
  )
    throw new TypeError('Manager option "clientId" must be a non-empty string.');

  if (
    typeof options.nodes !== "undefined" &&
    !Array.isArray(options.nodes)
  )
    throw new TypeError('Manager option "nodes" must be a array.');

  if (
    typeof options.shards !== "undefined" &&
    typeof options.shards !== "number"
  )
    throw new TypeError('Manager option "shards" must be a number.');

  if (
    typeof options.plugins !== "undefined" &&
    !Array.isArray(options.plugins)
  )
    throw new TypeError('Manager option "plugins" must be a Plugin array.');

  if (
    typeof options.autoPlay !== "undefined" &&
    typeof options.autoPlay !== "boolean"
  )
    throw new TypeError('Manager option "autoPlay" must be a boolean.');

  if (
    typeof options.trackPartial !== "undefined" &&
    !Array.isArray(options.trackPartial)
  )
    throw new TypeError('Manager option "trackPartial" must be a string array.');

  if (
    typeof options.clientName !== "undefined" &&
    typeof options.clientName !== "string"
  )
    throw new TypeError('Manager option "clientName" must be a string.');
}

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
  on(
    event: "queueEnd",
    listener: (
      player: Player,
      track: Track | UnresolvedTrack,
      payload: TrackEndEvent
    ) => void
  ): this;

  /**
   * Emitted when a player is moved to a new voice channel.
   * @event Manager#playerMove
   */
  on(
    event: "playerMove",
    listener: (player: Player, initChannel: string, newChannel: string) => void
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
    listener: (
      player: Player,
      track: Track | UnresolvedTrack,
      payload: TrackExceptionEvent
    ) => void
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

/**
 * The main hub for interacting with Lavalink and using Erela.JS,
 * @noInheritDoc
 */
export class Manager extends EventEmitter {
  /** The map of players. */
  public readonly players = new Collection<string, Player>();
  /** The map of nodes. */
  public readonly nodes = new Collection<string, Node>();
  /** The options that were set. */
  public readonly options: ManagerOptions;
  private initiated = false;

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
      });
  }

  /**
   * Initiates the Manager class.
   * @param options
   */
  constructor(options: ManagerOptions) {
    super();

    check(options);

    Structure.get("Player").init(this);
    Structure.get("Node").init(this);
    TrackUtils.init(this);

    if (options.trackPartial) {
      TrackUtils.setTrackPartial(options.trackPartial);
      delete options.trackPartial;
    }

    this.options = {
      plugins: [],
      nodes: [{ identifier: "default", host: "localhost" }],
      shards: 1,
      autoPlay: true,
      clientName: "erela.js",
      ...options,
    };

    if (this.options.plugins) {
      for (const [index, plugin] of this.options.plugins.entries()) {
        if (!(plugin instanceof Plugin))
          throw new RangeError(`Plugin at index ${index} does not extend Plugin.`);
        plugin.load(this);
      }
    }

    if (this.options.nodes) {
      for (const nodeOptions of this.options.nodes)
        new (Structure.get("Node"))(nodeOptions);
    }
  }

  /**
   * Initiates the Manager.
   * @param clientId
   */
  public init(clientId?: string): this {
    if (this.initiated) return this;
    if (typeof clientId !== "undefined") this.options.clientId = clientId;

    if (typeof this.options.clientId !== "string")
      throw new Error('"clientId" set is not type of "string"');

    if (!this.options.clientId)
      throw new Error(
        '"clientId" is not set. Pass it in Manager#init() or as a option in the constructor.'
      );

    for (const node of this.nodes.values()) node.connect();

    this.initiated = true;
    return this;
  }

  /**
   * Searches the enabled sources based off the URL or the `source` property.
   * @param query
   * @param requester
   * @returns The search result.
   */
  public search(
    query: string | SearchQuery,
    requester?: unknown
  ): Promise<SearchResult> {
    return new Promise(async (resolve, reject) => {
      const node = this.leastUsedNodes.first();
      if (!node) throw new Error("No available nodes.");

      const sources = {
        soundcloud: "sc",
        youtube: "yt",
      };

      const source = sources[(query as SearchQuery).source ?? "youtube"];
      let search = (query as SearchQuery).query || (query as string);

      if (!/^https?:\/\//.test(search)) {
        search = `${source}search:${search}`;
      }

      const res = await node.makeRequest<LavalinkResult>(`/loadtracks?identifier=${encodeURIComponent(search)}`, r => {
        if (node.options.requestTimeout) {
          r.timeout(node.options.requestTimeout)
        }
      }).catch(err => reject(err));

      if (!res) {
        return reject(new Error("Query not found."));
      }

      const result: SearchResult = {
        loadType: res.loadType,
        exception: res.exception ?? null,
        tracks: res.tracks.map((track: TrackData) =>
          TrackUtils.build(track, requester)
        ),
      };

      if (result.loadType === "PLAYLIST_LOADED") {
        result.playlist = {
          name: res.playlistInfo.name,
          selectedTrack: res.playlistInfo.selectedTrack === -1 ? null :
            TrackUtils.build(
              res.tracks[res.playlistInfo.selectedTrack],
              requester
            ),
          duration: result.tracks
            .reduce((acc: number, cur: Track) => acc + (cur.duration || 0), 0),
        };
      }

      return resolve(result);
    });
  }

  /**
   * Decodes the base64 encoded tracks and returns a TrackData array.
   * @param tracks
   */
  public decodeTracks(tracks: string[]): Promise<TrackData[]> {
    return new Promise(async (resolve, reject) => {
      const node = this.nodes.first();
      if (!node) throw new Error("No available nodes.");

      const res = await node.makeRequest<TrackData[]>(`/decodetracks`, r => r
        .method("POST")
        .body(tracks, "json"))
        .catch(err => reject(err));

      if (!res) {
        return reject(new Error("No data returned from query."));
      }

      return resolve(res);
    });
  }

  /**
   * Decodes the base64 encoded track and returns a TrackData.
   * @param track
   */
  public async decodeTrack(track: string): Promise<TrackData> {
    const res = await this.decodeTracks([ track ]);
    return res[0];
  }

  /**
   * Creates a player or returns one if it already exists.
   * @param options
   */
  public create(options: PlayerOptions): Player {
    if (this.players.has(options.guild)) {
      return this.players.get(options.guild);
    }

    return new (Structure.get("Player"))(options);
  }

  /**
   * Returns a player or undefined if it does not exist.
   * @param guild
   */
  public get(guild: string): Player | undefined {
    return this.players.get(guild);
  }

  /**
   * Destroys a player if it exists.
   * @param guild
   */
  public destroy(guild: string): void {
    this.players.delete(guild);
  }

  /**
   * Creates a node or returns one if it already exists.
   * @param options
   */
  public createNode(options: NodeOptions): Node {
    if (this.nodes.has(options.identifier || options.host)) {
      return this.nodes.get(options.identifier || options.host);
    }

    return new (Structure.get("Node"))(options);
  }

  /**
   * Destroys a node if it exists.
   * @param identifier
   */
  public destroyNode(identifier: string): void {
    const node = this.nodes.get(identifier);
    if (!node) return;
    node.destroy()
    this.nodes.delete(identifier)
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
        data.d.channel_id = player.voiceChannel;
        player.pause(true);
      }
    }

    player.voiceState = state;
    if (JSON.stringify(Object.keys(state).sort()) === TEMPLATE)
      player.node.send(state);
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
  clientId?: string;
  /** Value to use for the `Client-Name` header. */
  clientName?: string;
  /** The shard count. */
  shards?: number;
  /** A array of plugins to use. */
  plugins?: Plugin[];
  /** Whether players should automatically play the next song. */
  autoPlay?: boolean;
  /** An array of track properties to keep. `track` will always be present. */
  trackPartial?: string[];
  /**
   * Function to send data to the websocket.
   * @param id
   * @param payload
   */
  send(id: string, payload: Payload): void;
}

export interface SearchQuery {
  /** The source to search from. */
  source?: "youtube" | "soundcloud";
  /** The query to search for. */
  query: string;
}

export interface SearchResult {
  /** The load type of the result. */
  loadType: LoadType;
  /** The array of tracks from the result. */
  tracks: Track[];
  /** The playlist info if the load type is PLAYLIST_LOADED. */
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

export interface LavalinkResult {
  tracks: TrackData[];
  loadType: LoadType;
  exception?: {
    /** The message for the exception. */
    message: string;
    /** The severity of exception. */
    severity: string;
  };
  playlistInfo: {
    name: string;
    selectedTrack?: number;
  };
}
