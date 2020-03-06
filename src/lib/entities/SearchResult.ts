import { Track, ITrackData } from "./Track";
import { Type } from "../utils/Utils";

/**
 * The IException interface
 */
export interface IException {
    /**
     * The message for the exception.
     */
    readonly message: string;
    /**
     * The severity of the exception.
     */
    readonly severity: string;
}

/**
 * The IPlaylist class.
 */
export interface IPlaylist {
    /**
     * The info for the playlist.
     */
    readonly info: IPlaylistInfo;
    /**
     * The tracks for the playlist.
     */
    readonly tracks: Track[];
    /**
     * The total duration of the playlist.
     */
    readonly duration: number;
}
/**
 * The playlists info.
 */
interface IPlaylistInfo {
    /**
     * The name of the playlist.
     */
    readonly name?: string;
    /**
     * The selected track of the playlist.
     */
    readonly selectedTrack?: ITrackData|null;
}

export interface ISearchResultData {
    readonly loadType: string;
    readonly playlistInfo: IPlaylistInfo;
    readonly tracks: ITrackData[];
    readonly exception?: IException;
}

/**
 * The SearchResult class.
 */
export class SearchResult {
    /**
     * The load type of the search result.
     */
    public readonly loadType: string;
    /**
     * The tracks of the search result.
     */
    public readonly tracks: Track[];
    /**
     * The playlist of the search result.
     */
    public readonly playlist: IPlaylist;
    /**
     * The exception of the search result if one occurred.
     */
    public readonly exception: IException|undefined;
    /**
     * Creates an instance of SearchResult.
     * @param {any} data - The search result data.
     * @param {Track} track - The Track class.
     * @param {any} user - The user who requested the track.
     */
    public constructor(data: ISearchResultData, track: Type<Track>, user: any) {
        if (!data || !track || !user) {
            throw new RangeError("SearchResult constructor must have all three parameters filled.");
        }

        this.loadType = data.loadType;
        this.tracks = this.loadType !== "PLAYLIST_LOADED" ? data.tracks.map((d) => new track(d, user)) : [];
        this.playlist = {
            info: data.playlistInfo,
            tracks: this.loadType === "PLAYLIST_LOADED" ? data.tracks.map((d) => new track(d, user)) : [],
            duration: this.tracks.map((t) => t.duration).reduce((acc: number, cur: number) => acc + cur, 0),
        };

        if (data.exception) {
            this.exception = data.exception;
        }
    }
}
