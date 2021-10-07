export class Track {
    /** The source of this audio track */
    public source: string;
    /** The base64 encoded track. */
    public encoded: string;

    /** The title of the track. */
    public title: string;
    /** The author of the track. */
    public author: string;
    /** The identifier of the track. */
    public identifier: string;
    /** The duration of the track. */
    public duration: number;
    /** The uri of the track. */
    public uri: string;

    #data: NodeJS.Dict<unknown> = {}

    public get<T = unknown>(key: string): T {
        return this.#data[key] as T;
    }

    public set(key: string, value: unknown) {
        this.#data[key] = value;
    }
    
    constructor(data: unknown) {
        Object.assign(this, data);
        Object.freeze(this);
    }
}