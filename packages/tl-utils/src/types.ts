export interface TlArgument {
    name: string
    type: string
    predicate?: string
    comment?: string
}

export interface TlGeneric {
    name: string
    type: string
}

export interface TlEntry {
    kind: 'method' | 'class'
    name: string
    id: number
    type: string
    comment?: string
    generics?: TlGeneric[]
    arguments: TlArgument[]

    // additional fields for methods,
    // used primarily for documentation
    throws?: {
        code: number
        name: string
        comment?: string
    }[]
    available?: 'both' | 'bot' | 'user'
}

export interface TlUnion {
    name: string
    comment?: string
    classes: TlEntry[]
}

export interface TlFullSchema {
    entries: TlEntry[]
    classes: Record<string, TlEntry>
    methods: Record<string, TlEntry>
    unions: Record<string, TlUnion>
}

export interface TlError {
    code: number
    name: string
    description?: string
    virtual?: true

    // internal fields used by generator
    _auto?: true
    _paramNames?: string[]
}

export interface TlErrors {
    base: TlError[]
    errors: Record<string, TlError>
    throws: Record<string, string[]>
    userOnly: Record<string, 1>
}

interface BasicDiff<T, K> {
    added: T[]
    removed: T[]
    modified: K[]
}

interface PropertyDiff<T> {
    old: T
    new: T
}

export interface TlArgumentDiff {
    name: string
    type?: PropertyDiff<string>
    predicate?: PropertyDiff<string | undefined>
    comment?: PropertyDiff<string | undefined>
}

export interface TlEntryDiff {
    name: string
    id?: PropertyDiff<number>
    generics?: PropertyDiff<TlGeneric[] | undefined>
    arguments?: BasicDiff<TlArgument, TlArgumentDiff>
}

interface TlUnionDiff {
    name: string
    classes: BasicDiff<TlEntry, never>
    methods: BasicDiff<TlEntry, never>
}

export interface TlSchemaDiff {
    classes: BasicDiff<TlEntry, TlEntryDiff>
    methods: BasicDiff<TlEntry, TlEntryDiff>
    unions: BasicDiff<TlUnion, TlUnionDiff>
}

export const TL_PRIMITIVES = {
    int: 1,
    long: 1,
    int53: 1,
    int128: 1,
    int256: 1,
    double: 1,
    string: 1,
    bytes: 1,
    vector: 1,
    boolFalse: 1,
    boolTrue: 1,
    bool: 1,
    Bool: 1,
    true: 1,
    null: 1,
    Object: true
} as const
