// tslint:disable: no-invalid-this
import { Track } from "./Player";

const sizes = ["0", "1", "2", "3", "default", "mqdefault", "hqdefault", "maxresdefault"];

export function buildTrack(data: any, user: any): Track {
    return {
        track: data.track,
        title: data.info.title,
        identifier: data.info.identifier,
        author: data.info.author,
        length: data.info.length,
        isSeekable: data.info.isSeekable,
        isStream: data.info.isStream,
        uri: data.info.uri,
        get thumbnail() {
            return this.displayThumbnail();
        },
        displayThumbnail(size?: string) {
            const finalSize = sizes.find((s) => s === size) || "default";
            return this.uri.includes("youtube") ?
                `https://img.youtube.com/vi/${this.identifier}/${finalSize}.jpg` : "";
        },
        user,
    };
}

export function mix(derivedCtor: any, ...baseCtors: any[]) {
    baseCtors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            Object.defineProperty(
                derivedCtor.prototype,
                name,
                Object.getOwnPropertyDescriptor(baseCtor.prototype, name),
            );
        });
    });
}

/** The Structure class. */
export class Structure {
    /**
     * Extends a class.
     * @param {(any) => any} extender
     */
    public static extend(extender: (any) => any) {
        const name = this.constructor.name;
        Structures[name] = extender(Structures[name]);
    }

    /**
     * Returns the structure.
     * @param {keyof Structures} structure
     */
    public static get(structure: keyof typeof Structures) {
        if (!Structures[structure]) return null;
        return Structures[structure];
    }
}

export enum LoadType {
    TRACK_LOADED = "TRACK_LOADED",
    PLAYLIST_LOADED = "PLAYLIST_LOADED",
    SEARCH_RESULT = "SEARCH_RESULT",
    LOAD_FAILED = "LOAD_FAILED",
}

const Structures = {
    Player: require("./Player"),
    Queue: require("./Queue"),
    Node: require("./Node"),
};
