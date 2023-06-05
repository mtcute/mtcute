type Falsy = false | 0 | '' | null | undefined;

declare interface Array<T> {
    // support .filter(Boolean)
    filter<S extends T>(predicate: BooleanConstructor, thisArg?: unknown): Exclude<S, Falsy>[]
}
