import { Manager } from "./Manager";

/**
 * The Plugin class. 
 */
export interface Plugin {
	/**
	 * The name of this plugin.
	 */
	name: string;

	/**
	 * The provider(s) this plugin is meant to work with, omit if not required.
	 */
	provider?: string[];

	/**
	 * The version of this plugin.
	 */
	version: string;

	/**
	 * Ran when the plugin is loaded.
	 * @param manager {Manager}
	 */
	load(manager: Manager): Promise<void>;

	/**
	 * Ran when the plugin is unloaded to apply the previous state.
	 */
	unload(): Promise<void>;
}
