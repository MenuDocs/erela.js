export class Extendable {
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

const Structures = {
    Player: require("./Player"),
    Queue: require("./Queue"),
    Node: require("./Node"),
};

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
