import Collection from "@discordjs/collection";
import EventEmitter from "events";
import type { Player } from "./Player";

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
export interface Manager<O extends ManagerOptions, P extends Player<any, any>> extends EventEmitter {
	/**
	 * The options provided to this manager.
	 */
	readonly options: O;

	/**
	 * All the players that were created by this manager.
	 */
	readonly players: Collection<string, P>;

	/**
	 * Adds a plugin
	 * @param plugin Plugin
	 */
	use(plugin: Plugin): void;

	/**
	 * Adds an array of plugins
	 * @param plugins The plugins to use in this manager
	 */
	use(plugins: Plugin[]): void;

	/**
	 * Creates a Player with the provided Guild ID, `textChannel` and `voiceChannel` must be bound later.
	 */
	create(guild: string): P;

	// /**
	//  * Creates a Player with the provided Guild and Voice channel ID, `textChannel` must be bound later.
	//  */
	// create(guild: string, channel: string): P;

	/**
	 * Creates a Player with the provided player options.
	 */
	create(options: ExtractPlayerOptions<P>): P;

	/**
	 * Destroys a Player using the Guild ID.
	 */
	destroy(guild: string): void;

	/**
	 * Destroys a Player using the Player instance.
	 */
	destroy(player: P): void;
}

type ExtractPlayerOptions<P> = P extends Player<Manager<any, any>, infer O> ? O : never;

