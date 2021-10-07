/* eslint-disable no-unused-vars */

import Collection from '@discordjs/collection';
import EventEmitter from 'events';
import type { Player, PlayerOptions } from './Player';
import { Plugin } from './Plugin';
import { Track } from './Track';

export type Awaited<T> = T | PromiseLike<T>;

/**
 * The base options to provide for a audio provider.
 */
export interface ManagerOptions {
	/**
	 * A list of plugins to use with the audio provider, these may be specific for an audio provider.
	 */
	readonly plugins?: Plugin[]
}

export interface ManagerEvents {
	/** @event Manager#playerCreate */
	playerCreate: [player: Player];
	
	/** @event Manager#playerDestroy */
	playerDestroy: [player: Player];
	
	/** @event Manager#playerMove */
	playerMove: [player: Player, oldChannel: string, newChannel: string];

	/** @event Manager#trackStart */
	trackStart: [player: Player, track: Track, ...extra: any];

	/** @event Manager#trackEnd */
	trackEnd: [player: Player, track: Track, ...extra: any];
}

/**
 * The base Manager.
 */
export interface Manager extends EventEmitter {
	on<K extends keyof ManagerEvents>(event: K, listener: (...args: ManagerEvents[K]) => Awaited<void>): this;
	on<S extends string | symbol>(
	  event: Exclude<S, keyof ManagerEvents>,
	  listener: (...args: any[]) => Awaited<void>,
	): this;
  
	once<K extends keyof ManagerEvents>(event: K, listener: (...args: ManagerEvents[K]) => Awaited<void>): this;
	once<S extends string | symbol>(
	  event: Exclude<S, keyof ManagerEvents>,
	  listener: (...args: any[]) => Awaited<void>,
	): this;
  
	emit<K extends keyof ManagerEvents>(event: K, ...args: ManagerEvents[K]): boolean;
	emit<S extends string | symbol>(event: Exclude<S, keyof ManagerEvents>, ...args: unknown[]): boolean;

	/**
	 * All the audio players that were created by this manager.
	 */
	readonly players: Collection<string, Player>;
	
	/**
	 * All the plugins that have been added to the manager.
	 */
	readonly plugins: Collection<string, Plugin>;

	/**
	 * Adds an array of plugins.
	 * @param plugin Plugin
	 */
	use(...plugins: Plugin[]): void;

	// Player stuff

	/**
	 * Gets a player with the Guild ID or null if it does not exist. Identical to Map#get().
	 */
	get(guild: string): Player | null;

	/**
	 * Creates a Player with the provided Guild ID, `voiceChannel` and `textChannel` must be bound later.
	 */
	create(guild: string): Player;

	// /**
	//  * Creates a Player with the provided Guild and Voice channel ID, `textChannel` must be bound later.
	//  */
	// create(guild: string, channel: string): Player;

	/**
	 * Creates a Player with the provided player options.
	 */
	create(options: PlayerOptions): Player;

	/**
	 * Destroys a Player using the Guild ID and optionally disconnect from the voice channel.
	 */
	destroy(guild: string, disconnect?: boolean): Promise<boolean>;
}
