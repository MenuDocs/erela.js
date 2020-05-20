// tslint:disable: no-invalid-this max-classes-per-file no-empty max-line-length
import { Track, Player } from './Player';
import { Manager } from './Manager';
import { Queue } from './Queue';
import { Node } from './Node';

const sizes = [
  '0',
  '1',
  '2',
  '3',
  'default',
  'mqdefault',
  'hqdefault',
  'maxresdefault',
];

export function buildTrack(data: any, requester: any): Track {
  try {
    return {
      track: data.track,
      title: data.info.title,
      identifier: data.info.identifier,
      author: data.info.author,
      length: data.info.length,
      isSeekable: data.info.isSeekable,
      isStream: data.info.isStream,
      uri: data.info.uri,
      get thumbnail() {
        return this.displayThumbnail();
      },
      displayThumbnail(size?: string) {
        const finalSize = sizes.find((s) => s === size) || 'default';
        return this.uri.includes('youtube')
          ? `https://img.youtube.com/vi/${this.identifier}/${finalSize}.jpg`
          : '';
      },
      requester,
    };
  } catch {
    return null;
  }
}

export function mix(derivedCtor: any, ...baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name)
      );
    });
  });
}

/**
 * Formats the given duration into human readable format.
 * @param {number} milliseconds - The duration to format.
 * @param {boolean?} [minimal=false] - Whether to use a minimal format.
 * @returns {string} - The formatted duration.
 */
export function formatTime(milliseconds: number, minimal: boolean = false) {
  if (typeof milliseconds === 'undefined' || isNaN(milliseconds)) {
    throw new RangeError(
      'Utils#formatTime() Milliseconds must be a number greater than 0'
    );
  }

  if (typeof minimal !== 'boolean') {
    throw new RangeError('Utils#formatTime() Minimal must be a boolean');
  }

  if (milliseconds === 0) return minimal ? '00:00' : 'N/A';

  const times = {
    years: 0,
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };

  while (milliseconds > 0) {
    if (milliseconds - 31557600000 >= 0) {
      milliseconds -= 31557600000;
      times.years++;
    } else if (milliseconds - 2628000000 >= 0) {
      milliseconds -= 2628000000;
      times.months++;
    } else if (milliseconds - 604800000 >= 0) {
      milliseconds -= 604800000;
      times.weeks += 7;
    } else if (milliseconds - 86400000 >= 0) {
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
      if (v === 0 && !first) {
        continue;
      }
      finalTime.push(v < 10 ? `0${v}` : `${v}`);
      first = true;
      continue;
    }
    if (v > 0) {
      finalTime.push(`${v} ${v > 1 ? k : k.slice(0, -1)}`);
    }
  }

  if (minimal && finalTime.length === 1) finalTime.unshift('00');

  let time = finalTime.join(minimal ? ':' : ', ');

  if (time.includes(',')) {
    const pos = time.lastIndexOf(',');
    time = `${time.slice(0, pos)} and ${time.slice(pos + 1)}`;
  }

  return time;
}

/**
 * Parses the given duration into milliseconds.
 * @param {string} time - The duration to parse.
 * @returns {number} - The formatted duration.
 */
export function parseTime(time: string): number | null {
  const regex = /\d+\.*\d*\D+/g;
  time = time.split(/\s+/).join('');

  let res;
  let duration: number = 0;

  while ((res = regex.exec(time)) !== null) {
    if (res.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    const local: string = res[0].toLowerCase();
    if (
      local.endsWith('seconds') ||
      local.endsWith('second') ||
      (local.endsWith('s') && (local.match(/\D+/) as string[])[0].length === 1)
    ) {
      duration +=
        parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 1000;
    } else if (
      local.endsWith('minutes') ||
      local.endsWith('minute') ||
      (local.endsWith('m') && (local.match(/\D+/) as string[])[0].length === 1)
    ) {
      duration +=
        parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 60000;
    } else if (
      local.endsWith('hours') ||
      local.endsWith('hour') ||
      (local.endsWith('h') && (local.match(/\D+/) as string[])[0].length === 1)
    ) {
      duration +=
        parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 3600000;
    } else if (
      local.endsWith('days') ||
      local.endsWith('day') ||
      (local.endsWith('d') && (local.match(/\D+/) as string[])[0].length === 1)
    ) {
      duration +=
        parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 86400000;
    } else if (
      local.endsWith('weeks') ||
      local.endsWith('week') ||
      (local.endsWith('w') && (local.match(/\D+/) as string[])[0].length === 1)
    ) {
      duration +=
        parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 604800000;
    } else if (local.endsWith('months') || local.endsWith('month')) {
      duration +=
        parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 2628000000;
    } else if (
      local.endsWith('years') ||
      local.endsWith('year') ||
      (local.endsWith('y') && (local.match(/\D+/) as string[])[0].length === 1)
    ) {
      duration +=
        parseInt((local.match(/\d+\.*\d*/) as string[])[0], 10) * 31557600000;
    }
  }

  if (duration === 0) {
    return null;
  }
  return duration;
}

/** The Structure class. */
export class Structure {
  /**
   * Extends a class.
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
   * Returns the structure.
   * @param structure
   */
  public static get<K extends keyof Extendable>(structure: K): Extendable[K] {
    const struct = structures[structure];
    if (!struct) throw new TypeError('"structure" must be provided.');
    return struct;
  }
}

export class Plugin {
  public load(manager: Manager) {}
}

export enum LoadType {
  TRACK_LOADED = 'TRACK_LOADED',
  PLAYLIST_LOADED = 'PLAYLIST_LOADED',
  SEARCH_RESULT = 'SEARCH_RESULT',
  LOAD_FAILED = 'LOAD_FAILED',
  NO_MATCHES = 'NO_MATCHES',
}

export enum State {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  DISCONNECTING = 'DISCONNECTING',
  DESTROYING = 'DESTROYING',
}

export const structures = {
  Player: require('./Player').Player,
  Queue: require('./Queue').Queue,
  Node: require('./Node').Node,
};

export interface Extendable {
  Player: typeof Player;
  Queue: typeof Queue;
  Node: typeof Node;
}
