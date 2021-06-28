import type { Player } from "./api/Player";
import type { Manager } from "./api/Manager";
import { Detector } from "./impl/detection/Detector";

export namespace Erela {
	const plugins: Plugin[] = [];

	/**
	 * Adds a plugin that will be used when a Manager is created.
	 * @param plugin Plugin
	 */
	export function use(plugin: Plugin): void {
		plugins.push(plugin);
	}

	/**
	 * Creates a new player manager with the supplied options.
	 * @param options The options to supply the player manager.
	 * @param klass The provider class to instantiate.
	 */
	export async function create<M extends Manager>(options?: M["options"], provider?: Class<M>): Promise<M> {
		if (!provider) {
			const foundProviders = Detector.findProviders();
			if (!foundProviders.length) {
				throw new Error("No pre-installed providers were found, install one or provide a class to instantiate");
			}

			const foundProvider = foundProviders[0];

			const exportedManager = (require(foundProvider)).manager;
			if (!exportedManager) {
				throw new Error(`The provider "${foundProvider}" doesn't export a Manager`);
			}

			provider = exportedManager;
		}

		const manager = new provider!!(options);
		if (plugins.length) manager.use(plugins);

		return manager;
	}

	type Class<T> = {
		new(...args: any): T;
	}
}