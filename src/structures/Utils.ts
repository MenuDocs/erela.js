/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars, @typescript-eslint/no-use-before-define, @typescript-eslint/no-var-requires*/
import { Manager } from "./Manager";
import { Node, NodeStats } from "./Node";
import { Player, Track } from "./Player";
import { Queue } from "./Queue";

/** @hidden */
const template = ["second", "minute", "hour", "day"];

/** @hidden */
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

export abstract class TrackUtils {
  /**
   * Formats the given duration into human readable format.
   * @param milliseconds
   * @param [minimal=false]
   */
  static formatTime(milliseconds: number, minimal = false): string {
    if (typeof milliseconds === "undefined" || isNaN(milliseconds)) {
      throw new RangeError("Utils#formatTime() Milliseconds must be a number");
    }

    if (typeof minimal !== "boolean") {
      throw new RangeError("Utils#formatTime() Minimal must be a boolean");
    }

    if (milliseconds === 0) return minimal ? "00:00" : "N/A";

    const times = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };

    while (milliseconds > 0) {
      if (milliseconds - 86400000 >= 0) {
        milliseconds -= 86400000;
        times.days++;
      } else if (milliseconds - 3600000 >= 0) {
        milliseconds -= 3600000;
        times.hours++;
      } else if (milliseconds - 60000 >= 0) {
        milliseconds -= 60000;
        times.minutes++;
      } else {
        times.seconds = Math.round(milliseconds / 1000);
        milliseconds = 0;
      }
    }

    const finalTime: string[] = [];
    let first = false;

    for (const [k, v] of Object.entries(times)) {
      if (minimal) {
        if (v === 0 && !first) continue;
        finalTime.push(v < 10 ? `0${v}` : `${v}`);
        first = true;
        continue;
      }

      if (v > 0) finalTime.push(`${v} ${v > 1 ? k : k.slice(0, -1)}`);
    }

    if (minimal && finalTime.length === 1) finalTime.unshift("00");

    let time = finalTime.join(minimal ? ":" : ", ");

    if (time.includes(",")) {
      const pos = time.lastIndexOf(",");
      time = `${time.slice(0, pos)} and ${time.slice(pos + 1)}`;
    }

    return time;
  }

  /**
   * Parses the given duration into milliseconds.
   * @param time
   */
  static parseTime(time: string): number | null {
    if (time.includes(":"))
      time = time
        .split(":")
        .reverse()
        .map((v, i) => v + template[i])
        .join("");
    if (time.includes(" ")) time = time.split(/\s+/).join("");
    if (time.match(/^\d+$/)) time = `${time}seconds`;

    const regex = /\d+\.*\d*\D+/g;
    let res;
    let duration = 0;

    while ((res = regex.exec(time)) !== null) {
      if (res.index === regex.lastIndex) regex.lastIndex++;
      const local: string = res[0].toLowerCase();

      if (
        local.endsWith("seconds") ||
        local.endsWith("second") ||
        (local.endsWith("s") &&
          (local.match(/\D+/) as string[])[0].length === 1)
      ) {
        duration +=
          parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 1000;
      } else if (
        local.endsWith("minutes") ||
        local.endsWith("minute") ||
        (local.endsWith("m") &&
          (local.match(/\D+/) as string[])[0].length === 1)
      ) {
        duration +=
          parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 60000;
      } else if (
        local.endsWith("hours") ||
        local.endsWith("hour") ||
        (local.endsWith("h") &&
          (local.match(/\D+/) as string[])[0].length === 1)
      ) {
        duration +=
          parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 3600000;
      } else if (
        local.endsWith("days") ||
        local.endsWith("day") ||
        (local.endsWith("d") &&
          (local.match(/\D+/) as string[])[0].length === 1)
      ) {
        duration +=
          parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 86400000;
      }
    }

    if (duration === 0) return null;
    return duration;
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
        displayThumbnail(size): string {
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
    extender: (klass: Extendable[K]) => T
  ): T {
    if (!structures[name])
      throw new TypeError(`"${name} is not a valid structure`);
    const extended = extender(structures[name]);
    structures[name] = extended;
    return extended;
  }

  /**
   * Get a structure from available structures by name.
   * @param structure The name of the structure
   */
  public static get<K extends keyof Extendable>(structure: K): Extendable[K] {
    const struct = structures[structure];
    if (!struct) throw new TypeError('"structure" must be provided.');
    return struct;
  }
}

export class Plugin {
  public load(manager: Manager): void {}
}

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

/** @hidden */
export const structures = {
  Player: require("./Player").Player,
  Queue: require("./Queue").Queue,
  Node: require("./Node").Node,
};

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
  t: string;
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
