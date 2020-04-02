const sizes = ["0", "1", "2", "3", "default", "mqdefault", "hqdefault", "maxresdefault"];

/**
 * The ITrackInfo interface.
 */
export interface ITrackInfo {
    /**
     * The track's identifier.
     */
    readonly identifier: string;
    /**
     * Whether the track is seekable.
     */
    readonly isSeekable: boolean;
    /**
     * The author of the track.
     */
    readonly author: string;
    /**
     * The track's length.
     */
    readonly length: number;
    /**
     * Whether the track is a string.
     */
    readonly isStream: boolean;
    /**
     * The track's title.
     */
    readonly title: string;
    /**
     * The track's URI.
     */
    readonly uri: string;
}

/**
 * The ITrackData interface.
 */
export interface ITrackData {
    /**
     * The base 64 encoded track.
     */
    readonly track: string;
    /**
     * The tracks info.
     */
    readonly info: ITrackInfo;
}

/**
 * The Track class.
 */
export class Track {
    /**
     * The base 64 encoded track.
     */
    public readonly track: string;
    /**
     * The track's identifier.
     */
    public readonly identifier: string;
    /**
     * Whether the track is seekable.
     */
    public readonly isSeekable: boolean;
    /**
     * The author of the track.
     */
    public readonly author: string;
    /**
     * The track's duration.
     */
    public readonly duration: number;
    /**
     * Whether the track is a string.
     */
    public readonly isStream: boolean;
    /**
     * The track's title.
     */
    public readonly title: string;
    /**
     * The track's URL.
     */
    public readonly url: string;
    /**
     * The track's URI.
     */
    public readonly uri: string;
    /**
     * The user who requested the track.
     */
    public readonly requester: any;

    /**
     * Creates an instance of Track.
     * @param {ITrackData} data The data to pass.
     * @param {any} user The user who requested the track.
     */
    public constructor(data: ITrackData, requester: any) {
        if (!data || !requester) {
            throw new RangeError("Track constructor must have all two parameters filled.");
        }

        try {
            this.track = data.track;
            this.identifier = data.info.identifier;
            this.isSeekable = data.info.isSeekable;
            this.author = data.info.author;
            this.duration = data.info.length;
            this.isStream = data.info.isStream;
            this.title = data.info.title;
            this.uri = data.info.uri;
            this.url = data.info.uri;
            this.requester = requester;
        } catch (err) {
            throw new RangeError(`Invalid track passed. Reason: ${err}`);
        }
    }

    /**
     * Returns the thumbnail for the track. Only works for YouTube videos due to other sources requiring a API token.
     * Sizes that work: "0", "1", "2", "3", "default", "mqdefault", "hqdefault", "maxresdefault".
     * @param {string} [size] The size for the track.
     * @returns {string} The URL with the specified size, or the default one.
     */
    public displayThumbnail(size?: string): string {
        const finalSize = sizes.find((s) => s === size) || "default";
        return this.uri.includes("youtube") ? `https://img.youtube.com/vi/${this.identifier}/${finalSize}.jpg` : "";
    }
}
