import type { Manager, ManagerOptions } from './api/Manager';
import { Plugin } from './api/Plugin';
import Detector from './impl/detection/Detector';

type Class<T> = {
	// eslint-disable-next-line no-unused-vars
	new(...args: unknown[]): T;
}

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
 * @param provider The provider class to instantiate.
 */
export async function create<M extends Manager, O extends ManagerOptions>(options?: O, provider?: Class<M>): Promise<M> {
	if (!provider) {
		const foundProviders = Detector.findProviders();
		if (!foundProviders.length) {
			throw new Error('No pre-installed providers were found, install one or provide a class to instantiate');
		}

		const foundProvider = foundProviders[0];

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const exportedManager = require(foundProvider).manager;
		if (!exportedManager) {
			throw new Error(`The provider "${foundProvider}" doesn't export a Manager`);
		}

		provider = exportedManager;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const manager = new provider!(options);
	if (plugins.length) manager.use(...plugins);

	return manager;
}
