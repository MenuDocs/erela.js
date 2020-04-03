// tslint:disable: no-empty
import { Type } from "../utils/Utils";
import { ErelaClient } from "erela.js";

/**
 * The IPlugin interface.
 */
export interface IPlugin {
    /**
     * The name for the plugin.
     */
    name: string;
    /**
     * The values that should be passed to the plugin.
     */
    values?: any[];
    /**
     * The plugin reference.
     */
    plugin: Type<Plugin>;
}

/**
 * The Plugin class for adding additional functionality.
 */
export class Plugin {
    [property: string]: any;

    /**
     * Creates an instance of Plugin.
     * @param {ErelaClient} erela The ErelaClient.
     */
    public constructor(public readonly erela: ErelaClient) {}

    /**
     * Runs when the plugin is loaded.
     */
    public load(): void {}

    /**
     * Runs when the plugin is unloaded.
     */
    public unload(): void {}
}
