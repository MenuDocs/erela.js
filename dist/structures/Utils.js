"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Plugin = exports.Structure = exports.TrackUtils = exports.unresolvedTrackSymbol = void 0;
/** @hidden */
const trackSymbol = Symbol("track");
/** @hidden */
exports.unresolvedTrackSymbol = Symbol("unresolved");
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
class TrackUtils {
    static setTrackPartial(partial) {
        if (!Array.isArray(partial) || !partial.every(str => typeof str === "string"))
            throw new Error("Provided partial is not an array or not a string array.");
        if (!partial.includes("track"))
            partial.unshift("track");
        this.trackPartial = partial;
    }
    /**
     * Checks if the provided argument is a valid Track or UnresolvedTrack, if provided an array then every element will be checked.
     * @param trackOrTracks
     */
    static validate(trackOrTracks) {
        if (Array.isArray(trackOrTracks) && trackOrTracks.length) {
            for (const track of trackOrTracks) {
                if (!(track[trackSymbol] || track[exports.unresolvedTrackSymbol]))
                    return false;
            }
            return true;
        }
        return (trackOrTracks[trackSymbol] ||
            trackOrTracks[exports.unresolvedTrackSymbol]) === true;
    }
    /**
     * Checks if the provided argument is a valid UnresolvedTrack.
     * @param track
     */
    static isUnresolvedTrack(track) {
        return track[exports.unresolvedTrackSymbol] === true;
    }
    /**
     * Checks if the provided argument is a valid Track.
     * @param track
     */
    static isTrack(track) {
        return track[trackSymbol] === true;
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
                requester,
            };
            track.displayThumbnail = track.displayThumbnail.bind(track);
            if (this.trackPartial) {
                for (const key of Object.keys(track)) {
                    if (this.trackPartial.includes(key))
                        continue;
                    delete track[key];
                }
            }
            Object.defineProperty(track, trackSymbol, {
                value: true
            });
            return track;
        }
        catch (_a) {
            return undefined;
        }
    }
    /**
     * Builds a UnresolvedTrack to be resolved before being played  .
     * @param query
     * @param requester
     */
    static buildUnresolved(query, requester) {
        const unresolvedTrack = { query, requester };
        Object.defineProperty(unresolvedTrack, exports.unresolvedTrackSymbol, {
            value: true
        });
        return unresolvedTrack;
    }
}
exports.TrackUtils = TrackUtils;
TrackUtils.trackPartial = null;
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
