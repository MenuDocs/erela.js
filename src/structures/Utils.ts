/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars, @typescript-eslint/no-use-before-define, @typescript-eslint/no-var-requires*/
import { Manager } from "./Manager";
import { Node, NodeStats } from "./Node";
import { Player, Track } from "./Player";
import { Queue } from "./Queue";

const sizes = [
  "0",
  "1",
  "2",
  "3",
  "default",
  "mqdefault",
  "hqdefault",
  "maxresdefault",
];

const template = [
  "track",
  "title",
  "identifier",
  "author",
  "duration",
  "isSeekable",
  "isStream",
  "uri",
  "thumbnail",
];

const validate = (track: unknown) =>
  template.every((v) => Object.keys(track || {}).includes(v));

export abstract class TrackUtils {
  /**
   * Checks if the provided argument is a valid track or if the array is
   * @param trackOrTracks
   */
  static validate(trackOrTracks: unknown): boolean {
    if (Array.isArray(trackOrTracks) && trackOrTracks.length) {
      for (const track of trackOrTracks) {
        if (!validate(track)) return false;
      }
      return true;
    }

    return validate(trackOrTracks);
  }

  /**
   * Builds a Track from the raw data from Lavalink and a optional requester.
   * @param data
   * @param requester
   */
  static build(data: TrackData, requester?: unknown): Track | null {
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
        thumbnail: `https://img.youtube.com/vi/${data.info.identifier}/default.jpg`,
        displayThumbnail(size = "default"): string {
          const finalSize = sizes.find((s) => s === size) || "default";
          return this.uri.includes("youtube")
            ? `https://img.youtube.com/vi/${data.info.identifier}/${finalSize}.jpg`
            : "";
        },
        requester: requester,
      };

      track.displayThumbnail = track.displayThumbnail.bind(track);

      return track;
    } catch {
      return null;
    }
  }
}

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
}

const structures = {
  Player: require("./Player").Player,
  Queue: require("./Queue").Queue,
  Node: require("./Node").Node,
};

export type sizes =
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
  sessionId: string;
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
