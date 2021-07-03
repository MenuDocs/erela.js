/* eslint-disable no-unused-vars */

import Collection from '@discordjs/collection';
import EventEmitter from 'events';
import type { Player, PlayerOptions } from './Player';
import { Plugin } from './Plugin';

/**
 * The base options to provide for a audio provider.
 */
export interface ManagerOptions {
	/**
	 * A list of plugins to use with the audio provider, these may be specific for an audio provider.
	 */
	readonly plugins?: Plugin[]
}

/**
 * The base Manager
 */
export interface Manager extends EventEmitter {
	/**
	 * The options provided to this manager.
	 */
	readonly options: ManagerOptions;

	/**
	 * All the players that were created by this manager.
	 */
	readonly players: Collection<string, Player>;

	/**
	 * Adds a plugin
	 * @param plugin Plugin
	 */
	use(plugin: Plugin): void;

	/**
	 * Adds an array of plugins
	 * @param plugin Plugin
	 */
	use(plugins: Plugin[]): void;

	/**
	 * Creates a Player with the provided Guild ID, `textChannel` and `voiceChannel` must be bound later.
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
	 * Destroys a Player using the Guild ID.
	 */
	destroy(guild: string): void;

	/**
	 * Destroys a Player using the Player instance.
	 */
	destroy(player: Player): void;
}
