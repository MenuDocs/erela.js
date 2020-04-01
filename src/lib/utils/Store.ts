export default class Store<K, V> extends Map {
    constructor(iterable?: Iterable<any>) {
        // @ts-ignore
        super(iterable);
    }

    public get(key: K): V|undefined {
        return super.get(key);
    }

    public set(key: K, value: V): this {
        return super.set(key, value);
    }

    public find(fn: (val: V, key: K, col: Store<K, V>) => boolean): V|null {
        if (typeof fn !== "function") { throw new Error("First argument must be a function."); }
        for (const [key, val] of this) {
            if (fn(val, key, this)) {
                return val;
            }
        }
        return null;
    }

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

    public filter(fn: (val: V, key: K, col: Store<K, V>) => boolean): Store<K, V> {
        const results = new Store<K, V>();
        for (const [key, val] of this) {
        if (fn(val, key, this)) { results.set(key, val); }
        }
        return results;
    }

    public map(fn: (val: V, key: K, col: Store<K, V>) => any): any[] {
        const arr = new Array(this.size);
        let i = 0;
        for (const [key, val] of this) { arr[i++] = fn(val, key, this); }
        return arr;
    }

    public some(fn: (val: V, key: K, col: Store<K, V>) => boolean): boolean {
        for (const [key, val] of this) {
            if (fn(val, key, this)) {
                return true;
            }
        }
        return false;
    }

    public sort(compareFunction = (x: V, y: V) => + (x > y) || +(x === y) - 1): Store<K, V> {
        // @ts-ignore
        return new Store([...this.entries()].sort((a, b) => compareFunction(a[1], b[1], a[0], b[0])));
    }
}
