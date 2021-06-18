import type { Player, PlayerOptions } from "./api/Player";
import type { Manager, ManagerOptions } from "./api/Manager";
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
		*
		* @param options The options to supply the player manager.
		* @param klass The provider class to instantiate.
		*/
	export async function create<
		M extends Manager<ManagerOptions, PlayerOptions, Player>
	>(options: ExtractOptions<M>, klass?: Class<M>): Promise<M>

	export async function create<
		M extends Manager<O, PO, P>,
		O extends ManagerOptions = ManagerOptions,
		PO extends PlayerOptions = PlayerOptions,
		P extends Player<PO> = Player<PO>
	>(options?: O, klass?: Class<M>): Promise<M> {
		if (!klass) {
			const providers = Detector.findProviders();
			if (!providers.length) {
				throw new Error("No pre-installed providers were found, install one or provide a class to instantiate");
			}

			const provider = providers[0];

			const exportedManager = (require(provider)).manager;
			if (!exportedManager) {
				throw new Error(`The provider "${provider}" doesn't export a Manager`);
			}

			klass = exportedManager;
		}

		const manager = new klass!!(options);
		if (plugins.length) manager.use(plugins);

		return manager;
	}

	type ExtractOptions<P> = P extends Manager<infer O, Player> ? O : never;

	type Class<T> = {
		new(...args: any): T;
	}
}