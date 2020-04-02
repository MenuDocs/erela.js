import { Store } from "../utils/Store";
import { ErelaClient } from "../ErelaClient";
import { Plugin, IPlugin } from "../classes/Plugin";

/**
 * The PluginStore class.
 */
export class PluginStore extends Store<string, Plugin> {

    /**
     * Creates an instance of PluginStore.
     * @param {ErelaClient} erela - The ErelaClient.
     */
    public constructor(public readonly erela: ErelaClient) {
        super();
    }

    /**
     * Loads a Plugin.
     * @param {IPlugin} options The options to load a Plugin.
     */
    public load(options: IPlugin): void {
        if (this.has(options.name)) {
            throw new Error(`PluginStore#load() Plugin with identifier "${options.name}" already exists.`);
        }

        const plugin = new options.plugin(this.erela, ...(options.values || []));

        if (!(plugin instanceof Plugin)) {
            throw new Error(`PluginStore#load() Plugin supplied does not extend from "Plugin".`);
        }

        plugin.load();
        this.set(options.name, plugin);
        this.erela.emit("pluginLoad", plugin);
    }

    /**
     * Unloads a Plugin.
     * @param {string} name The name of the plugin to remove.
     */
    public unload(name: string): void {
        const plugin = this.get(name);
        if (!plugin) { return null; }
        plugin.unload();
        this.delete(name);
        this.erela.emit("pluginUnload", plugin);
    }
}
