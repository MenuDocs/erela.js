"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plugin = exports.Structure = exports.TrackUtils = void 0;
const sizes = [
    "0",
    "1",
    "2",
    "3",
    "default",
    "mqdefault",
    "hqdefault",
    "maxresdefault",
];
const defaultTemplate = [
    "track",
    "title",
    "identifier",
    "author",
    "duration",
    "isSeekable",
    "isStream",
    "uri",
    "thumbnail",
];
const validate = (track) => {
    const keys = Object.keys(track || {});
    return defaultTemplate.every((v) => keys.includes(v));
};
class TrackUtils {
    /**
     * Checks if the provided argument is a valid track or if the array is
     * @param trackOrTracks
     */
    static validate(trackOrTracks) {
        if (Array.isArray(trackOrTracks) && trackOrTracks.length) {
            for (const track of trackOrTracks) {
                if (!validate(track))
                    return false;
            }
            return true;
        }
        return validate(trackOrTracks);
    }
    /**
     * Builds a Track from the raw data from Lavalink and a optional requester.
     * @param data
     * @param requester
     */
    static build(data, requester) {
        try {
            const track = {
                track: data.track,
                title: data.info.title,
                identifier: data.info.identifier,
                author: data.info.author,
                duration: data.info.length,
                isSeekable: data.info.isSeekable,
                isStream: data.info.isStream,
                uri: data.info.uri,
                thumbnail: data.info.uri.includes("youtube")
                    ? `https://img.youtube.com/vi/${data.info.identifier}/default.jpg`
                    : null,
                displayThumbnail(size = "default") {
                    var _a;
                    const finalSize = (_a = sizes.find((s) => s === size)) !== null && _a !== void 0 ? _a : "default";
                    return this.uri.includes("youtube")
                        ? `https://img.youtube.com/vi/${data.info.identifier}/${finalSize}.jpg`
                        : null;
                },
                requester: requester,
            };
            track.displayThumbnail = track.displayThumbnail.bind(track);
            return track;
        }
        catch (_a) {
            return undefined;
        }
    }
}
exports.TrackUtils = TrackUtils;
class Structure {
    /**
     * Extends a class.
     * @param name
     * @param extender
     */
    static extend(name, extender) {
        if (!structures[name])
            throw new TypeError(`"${name} is not a valid structure`);
        const extended = extender(structures[name]);
        structures[name] = extended;
        return extended;
    }
    /**
     * Get a structure from available structures by name.
     * @param name
     */
    static get(name) {
        const structure = structures[name];
        if (!structure)
            throw new TypeError('"structure" must be provided.');
        return structure;
    }
}
exports.Structure = Structure;
class Plugin {
    load(manager) {
    }
}
exports.Plugin = Plugin;
const structures = {
    Player: require("./Player").Player,
    Queue: require("./Queue").Queue,
    Node: require("./Node").Node,
};
