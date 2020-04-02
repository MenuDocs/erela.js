/**
 * The Store class, same as Map.
 */
export class Store<K, V> extends Map {
    /**
     * Creates an instance of Store.
     * @param {Iterable<any>} [iterable] The data to store upon creation.
     */
    constructor(iterable?: Iterable<any>) {
        // @ts-ignore
        super(iterable);
    }

    /**
     * Gets a value from the Store.
     * @param {K} key The key to use.
     * @returns {(V|undefined)} The value from the Store.
     */
    public get(key: K): V|undefined {
        return super.get(key);
    }

    /**
     * Sets a value in the Store.
     * @param {K} key The key to use.
     * @param {V} value The value to set.
     * @returns {this} The Store.
     */
    public set(key: K, value: V): this {
        return super.set(key, value);
    }

    /**
     * Finds an value using a callback function.
     * @param {(val: V, key: K, col?: Store<K, V>) => boolean} fn The callback function.
     * @returns {(V|null)} The value from the Store, null if it does not exist.
     */
    public find(fn: (val: V, key: K, col?: Store<K, V>) => boolean): V|null {
        if (typeof fn !== "function") { throw new Error("First argument must be a function."); }
        for (const [key, val] of this) {
            if (fn(val, key, this)) {
                return val;
            }
        }
        return null;
    }

    /**
     * Returns the first value from Store, or an array of the first values.
     * @param {number} [count] The amount to return.
     * @returns {(V|V[])} The value or array of values.
     */
    public first(count?: number): V|V[] {
        if (count === undefined) { return this.values().next().value; }
        if (typeof count !== "number") { throw new TypeError("The count must be a number."); }
        if (!Number.isInteger(count) || count < 1) {
            throw new RangeError("The count must be an integer greater than 0.");
        }
        count = Math.min(this.size, count);
        const arr = new Array(count);
        const iter = this.values();
        for (let i = 0; i < count; i++) {
            arr[i] = iter.next().value;
        }
        return arr;
    }

    /**
     * Filters the Store to return a Store based on a callback function.
     * @param {(val: V, key: K, col: Store<K, V>) => boolean} fn  The callback function.
     * @returns {Store<K, V>} The filter Store.
     */
    public filter(fn: (val: V, key: K, col: Store<K, V>) => boolean): Store<K, V> {
        const results = new Store<K, V>();
        for (const [key, val] of this) {
        if (fn(val, key, this)) { results.set(key, val); }
        }
        return results;
    }

    /**
     * Maps the Store to return an array based on a callback function.
     * @param {(val: V, key: K, col: Store<K, V>) => any} fn The callback function.
     * @returns {any[]} An array of values based on what the callback function returns.
     */
    public map(fn: (val: V, key: K, col: Store<K, V>) => any): any[] {
        const arr = new Array(this.size);
        let i = 0;
        for (const [key, val] of this) { arr[i++] = fn(val, key, this); }
        return arr;
    }

    /**
     * Determines whether the specified callback function returns true for any element in the Store.
     * @param {(val: V, key: K, col: Store<K, V>) => boolean} fn The callback function.
     * @returns {boolean} Whether a value was found.
     */
    public some(fn: (val: V, key: K, col: Store<K, V>) => boolean): boolean {
        for (const [key, val] of this) {
            if (fn(val, key, this)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Sorts the Store with the callback function.
     * @param {*} [compareFunction=(x: V, y: V) => + (x > y) || +(x === y) - 1] The callback function.
     * @returns {Store<K, V>} The sorted Store.
     */
    public sort(compareFunction = (x: V, y: V) => + (x > y) || +(x === y) - 1): Store<K, V> {
        return new Store([...this.entries()].sort((a, b) => compareFunction(a[1], b[1])));
    }
}
