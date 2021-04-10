/* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars, @typescript-eslint/no-var-requires*/
import { Manager } from "./Manager";
import { Node, NodeStats } from "./Node";
import { Player, Track, UnresolvedTrack } from "./Player";
import { Queue } from "./Queue";

/** @hidden */
const TRACK_SYMBOL = Symbol("track"),
  /** @hidden */
  UNRESOLVED_TRACK_SYMBOL = Symbol("unresolved"),
  SIZES = [
    "0",
    "1",
    "2",
    "3",
    "default",
    "mqdefault",
    "hqdefault",
    "maxresdefault",
  ];

/** @hidden */
const escapeRegExp = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export abstract class TrackUtils {
  static trackPartial: string[] | null = null;
  private static manager: Manager;

  /** @hidden */
  public static init(manager: Manager): void {
    this.manager = manager;
  }

  static setTrackPartial(partial: string[]): void {
    if (
      !Array.isArray(partial) ||
      !partial.every((str) => typeof str === "string")
    )
      throw new Error(
        "Provided partial is not an array or not a string array."
      );
    if (!partial.includes("track")) partial.unshift("track");

    this.trackPartial = partial;
  }

  /**
   * Checks if the provided argument is a valid Track or UnresolvedTrack, if provided an array then every element will be checked.
   * @param trackOrTracks
   */
  static validate(trackOrTracks: unknown): boolean {
    if (typeof trackOrTracks === "undefined")
      throw new RangeError("Provided argument must be present.");

    if (Array.isArray(trackOrTracks) && trackOrTracks.length) {
      for (const track of trackOrTracks) {
        if (!(track[TRACK_SYMBOL] || track[UNRESOLVED_TRACK_SYMBOL]))
          return false;
      }
      return true;
    }

    return (
      (trackOrTracks[TRACK_SYMBOL] ||
        trackOrTracks[UNRESOLVED_TRACK_SYMBOL]) === true
    );
  }

  /**
   * Checks if the provided argument is a valid UnresolvedTrack.
   * @param track
   */
  static isUnresolvedTrack(track: unknown): boolean {
    if (typeof track === "undefined")
      throw new RangeError("Provided argument must be present.");
    return track[UNRESOLVED_TRACK_SYMBOL] === true;
  }

  /**
   * Checks if the provided argument is a valid Track.
   * @param track
   */
  static isTrack(track: unknown): boolean {
    if (typeof track === "undefined")
      throw new RangeError("Provided argument must be present.");
    return track[TRACK_SYMBOL] === true;
  }

  /**
   * Builds a Track from the raw data from Lavalink and a optional requester.
   * @param data
   * @param requester
   */
  static build(data: TrackData, requester?: unknown): Track {
    if (typeof data === "undefined")
      throw new RangeError('Argument "data" must be present.');

    try {
      const track: Track = {
        track: data.track,
        title: data.info.title,
        identifier: data.info.identifier,
        author: data.info.author,
        duration: data.info.length,
        isSeekable: data.info.isSeekable,
        isStream: data.info.isStream,
        uri: data.info.uri,
        spotifyUri: null,
        thumbnail: data.info.uri.includes("youtube")
          ? `https://img.youtube.com/vi/${data.info.identifier}/default.jpg`
          : null,
        displayThumbnail(size = "default"): string | null {
          const finalSize = SIZES.find((s) => s === size) ?? "default";
          return this.uri.includes("youtube")
            ? `https://img.youtube.com/vi/${data.info.identifier}/${finalSize}.jpg`
            : null;
        },
        requester,
      };

      track.displayThumbnail = track.displayThumbnail.bind(track);

      if (this.trackPartial) {
        for (const key of Object.keys(track)) {
          if (this.trackPartial.includes(key)) continue;
          delete track[key];
        }
      }

      Object.defineProperty(track, TRACK_SYMBOL, {
        configurable: true,
        value: true,
      });

      return track;
    } catch (error) {
      throw new RangeError(
        `Argument "data" is not a valid track: ${error.message}`
      );
    }
  }

  /**
   * Builds a UnresolvedTrack to be resolved before being played  .
   * @param query
   * @param requester
   */
  static buildUnresolved(
    query: string | UnresolvedQuery,
    requester?: unknown
  ): UnresolvedTrack {
    if (typeof query === "undefined")
      throw new RangeError('Argument "query" must be present.');

    let unresolvedTrack: Partial<UnresolvedTrack> = {
      requester,
      async resolve(): Promise<void> {
        const resolved = await TrackUtils.getClosestTrack(this);
        Object.getOwnPropertyNames(this).forEach((prop) => delete this[prop]);
        Object.assign(this, resolved);
      },
    };

    if (typeof query === "string") unresolvedTrack.title = query;
    else unresolvedTrack = { ...unresolvedTrack, ...query };

    Object.defineProperty(unresolvedTrack, UNRESOLVED_TRACK_SYMBOL, {
      configurable: true,
      value: true,
    });

    return unresolvedTrack as UnresolvedTrack;
  }

  static async getClosestTrack(
    unresolvedTrack: UnresolvedTrack
  ): Promise<Track> {
    if (!TrackUtils.manager)
      throw new RangeError("Manager has not been initiated.");

    if (!TrackUtils.isUnresolvedTrack(unresolvedTrack))
      throw new RangeError("Provided track is not a UnresolvedTrack.");

    const query = [unresolvedTrack.author, unresolvedTrack.title]
      .filter((str) => !!str)
      .join(" - ");
    const res = await TrackUtils.manager.search(
      query,
      unresolvedTrack.requester
    );

    if (res.loadType !== "SEARCH_RESULT")
      throw (
        res.exception ?? {
          message: "No tracks found.",
          severity: "COMMON",
        }
      );

    if (unresolvedTrack.author) {
      const channelNames = [
        unresolvedTrack.author,
        `${unresolvedTrack.author} - Topic`,
      ];

      const originalAudio = res.tracks.find((track) => {
        return (
          channelNames.some((name) =>
            new RegExp(`^${escapeRegExp(name)}$`, "i").test(track.author)
          ) ||
          new RegExp(`^${escapeRegExp(unresolvedTrack.title)}$`, "i").test(
            track.title
          )
        );
      });

      if (originalAudio) {
        if (unresolvedTrack.spotifyUri)
          originalAudio.spotifyUri = unresolvedTrack.spotifyUri;
        return originalAudio;
      }
    }

    if (unresolvedTrack.duration) {
      const sameDuration = res.tracks.find(
        (track) =>
          track.duration >= unresolvedTrack.duration - 1500 &&
          track.duration <= unresolvedTrack.duration + 1500
      );

      if (sameDuration) {
        if (unresolvedTrack.spotifyUri)
          sameDuration.spotifyUri = unresolvedTrack.spotifyUri;
        return sameDuration;
      }
    }
    if (unresolvedTrack.spotifyUri)
      res.tracks[0].spotifyUri = unresolvedTrack.spotifyUri;
    return res.tracks[0];
  }
}

/** Gets or extends structures to extend the built in, or already extended, classes to add more functionality. */
export abstract class Structure {
  /**
   * Extends a class.
   * @param name
   * @param extender
   */
  public static extend<K extends keyof Extendable, T extends Extendable[K]>(
    name: K,
    extender: (target: Extendable[K]) => T
  ): T {
    if (!structures[name])
      throw new TypeError(`"${name} is not a valid structure`);
    const extended = extender(structures[name]);
    structures[name] = extended;
    return extended;
  }

  /**
   * Get a structure from available structures by name.
   * @param name
   */
  public static get<K extends keyof Extendable>(name: K): Extendable[K] {
    const structure = structures[name];
    if (!structure) throw new TypeError('"structure" must be provided.');
    return structure;
  }
}

export class Plugin {
  public load(manager: Manager): void {}

  public unload(manager: Manager): void {}
}

const structures = {
  Player: require("./Player").Player,
  Queue: require("./Queue").Queue,
  Node: require("./Node").Node,
};

export interface UnresolvedQuery {
  /** The title of the unresolved track. */
  title: string;
  /** The author of the unresolved track. If provided it will have a more precise search. */
  author?: string;
  /** The duration of the unresolved track. If provided it will have a more precise search. */
  duration?: number;
}

export type Sizes =
  | "0"
  | "1"
  | "2"
  | "3"
  | "default"
  | "mqdefault"
  | "hqdefault"
  | "maxresdefault";

export type LoadType =
  | "TRACK_LOADED"
  | "PLAYLIST_LOADED"
  | "SEARCH_RESULT"
  | "LOAD_FAILED"
  | "NO_MATCHES";

export type State =
  | "CONNECTED"
  | "CONNECTING"
  | "DISCONNECTED"
  | "DISCONNECTING"
  | "DESTROYING";

export type PlayerEvents =
  | TrackStartEvent
  | TrackEndEvent
  | TrackStuckEvent
  | TrackExceptionEvent
  | WebSocketClosedEvent;

export type PlayerEventType =
  | "TrackStartEvent"
  | "TrackEndEvent"
  | "TrackExceptionEvent"
  | "TrackStuckEvent"
  | "WebSocketClosedEvent";

export type TrackEndReason =
  | "FINISHED"
  | "LOAD_FAILED"
  | "STOPPED"
  | "REPLACED"
  | "CLEANUP";

export type Severity = "COMMON" | "SUSPICIOUS" | "FAULT";

export interface TrackData {
  track: string;
  info: TrackDataInfo;
}

export interface TrackDataInfo {
  title: string;
  identifier: string;
  author: string;
  length: number;
  isSeekable: boolean;
  isStream: boolean;
  uri: string;
}

export interface Extendable {
  Player: typeof Player;
  Queue: typeof Queue;
  Node: typeof Node;
}

export interface VoiceState {
  op: "voiceUpdate";
  guildId: string;
  event: VoiceEvent;
  sessionId?: string;
}

export interface VoiceEvent {
  token: string;
  guild_id: string;
  endpoint: string;
}

export interface VoicePacket {
  t?: string;
  d: Partial<{
    guild_id: string;
    user_id: string;
    session_id: string;
    channel_id: string;
  }> &
    VoiceEvent;
}

export interface NodeMessage extends NodeStats {
  type: PlayerEventType;
  op: "stats" | "playerUpdate" | "event";
  guildId: string;
}

export interface PlayerEvent {
  op: "event";
  type: PlayerEventType;
  guildId: string;
}

export interface Exception {
  severity: Severity;
  message: string;
  cause: string;
}

export interface TrackStartEvent extends PlayerEvent {
  type: "TrackStartEvent";
  track: string;
}

export interface TrackEndEvent extends PlayerEvent {
  type: "TrackEndEvent";
  track: string;
  reason: TrackEndReason;
}

export interface TrackExceptionEvent extends PlayerEvent {
  type: "TrackExceptionEvent";
  exception?: Exception;
  error: string;
}

export interface TrackStuckEvent extends PlayerEvent {
  type: "TrackStuckEvent";
  thresholdMs: number;
}

export interface WebSocketClosedEvent extends PlayerEvent {
  type: "WebSocketClosedEvent";
  code: number;
  byRemote: boolean;
  reason: string;
}

export interface PlayerUpdate {
  op: "playerUpdate";
  state: {
    position: number;
    time: number;
  };
  guildId: string;
}
