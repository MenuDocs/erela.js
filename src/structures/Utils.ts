type Arg<T> = T extends (...args: infer U) => any ? U : never;

export abstract class Extendable {
    public static extend(extender: Arg<Extendable>) {
        const name = this.constructor.name;
        structures[name] = extender(structures[name]);
    }
}

const structures = {
    Player: require("./Player"),
    Queue: require("./Queue"),
    Node: require("./Node"),
};
