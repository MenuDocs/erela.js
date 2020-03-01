import { User } from "discord.js";

/**
 * The ITrackInfo interface.
 * @interface ITrackInfo
 */
export interface ITrackInfo {
    readonly identifier: string;
    readonly isSeekable: boolean;
    readonly author: string;
    readonly length: number;
    readonly isStream: boolean;
    readonly title: string;
    readonly uri: string;
}

/**
 * The ITrackData interface.
 * @export
 * @interface ITrackData
 */
export interface ITrackData {
    readonly track: string;
    readonly info: ITrackInfo;
}

/**
 * The ITrack interface.
 * @export
 * @interface ITrack
 */
export interface ITrack {
    readonly track: string;
    readonly identifier: string;
    readonly isSeekable: boolean;
    readonly author: string;
    readonly duration: number;
    readonly isStream: boolean;
    readonly title: string;
    readonly uri: string;
    readonly thumbnail: string;
    readonly hqThumbnail: string;
    readonly requester: User;
}

/**
 * The Track class.
 * @export
 * @class Track
 * @implements {ITrack}
 */
export class Track implements ITrack {
    public track: string;
    public identifier: string;
    public isSeekable: boolean;
    public author: string;
    public duration: number;
    public isStream: boolean;
    public title: string;
    public uri: string;
    public thumbnail: string;
    public hqThumbnail: string;
    public requester: User;
    /**
     * Creates an instance of Track.
     * @param {TrackData} data - The data to pass.
     * @param {User} user - The user who requested the track.
     * @memberof Track
     */
    public constructor(data: ITrackData, user: User) {
        if (!data || !user) {
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
            this.thumbnail = this.uri.includes("youtube") ?
                `https://img.youtube.com/vi/${this.identifier}/default.jpg` : "";
            this.hqThumbnail = this.uri.includes("youtube") ?
                `https://img.youtube.com/vi/${this.identifier}/hqdefault.jpg` : "";
            this.requester = user;
        } catch (err) {
            throw new RangeError(`Invalid track passed. Reason: ${err}`);
        }
    }
}
