/*
    This uses modified code from https://github.com/discordjs/discord.js/blob/stable/src/util/Structures.js
*/

import { Type } from "./Utils";

const classes = {
    ErelaClient: require("../ErelaClient").ErelaClient,
    Node: require("../classes/Node").Node,
    Player: require("../classes/Player").Player,
    Queue: require("../classes/Queue").Queue,
    SearchResult: require("../classes/SearchResult").SearchResult,
    Track: require("../classes/Track").Track,
};

/**
 * The Classes class for managing extending classes.
 */
export class Classes {
    /**
     * Returns the Class.
     * @param {string} name
     * @returns {(Function | any)} The class, or null if it does not exist.
     */
    // tslint:disable-next-line:ban-types
    public static get(name: string): Function | any {
        if (typeof name === "string") { return classes[name]; }
        throw new TypeError(`"structure" argument must be a string (received ${typeof name})`);
    }

    /**
     * Extends a class to add additional functionality.
     * @param {string} name The Class name.
     * @param {(clazz: Type<any>) => Type<any>} extender The Function to return the extended Class.
     */
    public static extend(name: string, extender: (clazz: Type<any>) => Type<any>) {
        const clazz = classes[name];
        if (!clazz) { throw new RangeError(`"${name}" is not a valid extensible class.`); }
        if (typeof extender !== "function") {
            const received = `(received ${typeof extender})`;
            throw new TypeError(
                `"extender" argument must be a function that returns the extended class/prototype ${received}.`,
            );
        }

        const extended = extender(clazz);
        if (typeof extended !== "function") {
            const received = `(received ${typeof extended})`;
            throw new TypeError(
                `The extender function must return the extended class/prototype ${received}.`,
            );
        }

        if (!(extended.prototype instanceof clazz)) {
            const prototype = Object.getPrototypeOf(extended);
            const received = `${extended.name || "unnamed"}${prototype.name ? ` extends ${prototype.name}` : ""}`;
            throw new Error(
                "The class/prototype returned from the extender function must extend the existing " +
                `class/prototype (received function ${received}; expected extension of ${clazz.name}).`,
            );
        }

        classes[name] = extended;
    }
}
