import { User } from "discord.js";
import { ITrack, ITrackData } from "../structures/Track";

/**
 * The IException interface
 * @export
 * @interface IException
 */
export interface IException {
    readonly message: string;
    readonly severity: string;
}

/**
 * The ISearchResult class.
 * @export
 * @interface ISearchResult
 */
export interface ISearchResult {
    readonly loadType: string;
    readonly tracks: ITrack[];
    readonly playlist: IPlaylist;
    readonly exception?: IException;
}

/**
 * The IPlaylist class.
 * @export
 * @interface IPlaylist
 */
export interface IPlaylist {
    readonly info: IPlaylistInfo;
    readonly tracks: ITrackData[];
}

/**
 * The IPlaylistInfo class.
 * @export
 * @interface IPlaylistInfo
 */
export interface IPlaylistInfo {
    readonly name?: string;
    readonly selectedTrack?: ITrackData|null;
}

/**
 * The ISearchResultData class.
 * @export
 * @interface ISearchResultData
 */
export interface ISearchResultData {
    readonly loadType: string;
    readonly playlistInfo: IPlaylistInfo;
    readonly tracks: ITrackData[];
    readonly exception?: IException;
}

/**
 * The SearchResult class.
 * @export
 * @class SearchResult
 * @implements {ISearchResult}
 */
export class SearchResult implements ISearchResult {
    public readonly loadType: string;
    public readonly tracks: ITrack[];
    public readonly playlist: IPlaylist;
    public readonly exception: IException|undefined;
    /**
     * Creates an instance of SearchResult.
     * @param {SearchResultData} data - The search result data.
     * @param {ITrack} track - The Track class.
     * @param {User} user - The user who requested the track.
     * @memberof SearchResult
     */
    public constructor(data: ISearchResultData, track: ITrack, user: User) {
        if (!data || !track || !user) {
            throw new RangeError("SearchResult constructor must have all three parameters filled.");
        }

        this.loadType = data.loadType;
        this.tracks = this.loadType !== "PLAYLIST_LOADED" ? data.tracks.map((d) => new (track as any)(d, user)) : [];
        this.playlist = {
            info: data.playlistInfo,
            tracks: this.loadType === "PLAYLIST_LOADED" ? data.tracks.map((d) => new (track as any)(d, user)) : [],
        };

        if (data.exception) {
            this.exception = data.exception;
        }
    }
}
