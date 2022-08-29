/**
 * An argument of a TL entry
 */
export interface TlArgument {
    /**
     * Name of the argument
     */
    name: string

    /**
     * Type of the argument
     */
    type: string

    /**
     * Predicate of the argument
     * @example `flags.3`
     */
    predicate?: string

    /**
     * Comment of the argument
     */
    comment?: string
}

/**
 * A generic argument of a TL entry
 */
export interface TlGeneric {
    /**
     * Name of the generic
     */
    name: string

    /**
     * Super type of the generic
     */
    type: string
}

/**
 * A TL entry
 */
export interface TlEntry {
    /**
     * Kind of the entry
     */
    kind: 'method' | 'class'

    /**
     * Name of the entry
     */
    name: string

    /**
     * ID of the entry (may be 0 if not known)
     */
    id: number

    /**
     * Type of the entry
     */
    type: string

    /**
     * Comment of the entry
     */
    comment?: string

    /**
     * Generic arguments of the entry
     */
    generics?: TlGeneric[]

    /**
     * Arguments of the entry
     */
    arguments: TlArgument[]

    // additional fields for methods,
    // used primarily for documentation
    /**
     * Errors that this method can throw (only if kind is `method`)
     */
    throws?: {
        /**
         * Error code
         * @example 429
         */
        code: number

        /**
         * Error name
         * @example `FLOOD_WAIT_%d`
         */
        name: string

        /**
         * Description of the error
         */
        comment?: string
    }[]

    /**
     * Availability of the method (only if kind is `method`)
     */
    available?: 'both' | 'bot' | 'user'
}

/**
 * A TL union (classes that share the same `type`)
 */
export interface TlUnion {
    /**
     * Name of the union (`== classes[*].type`)
     */
    name: string

    /**
     * Description of the union
     */
    comment?: string

    /**
     * Classes in the union
     */
    classes: TlEntry[]
}

/**
 * A full TL schema information
 *
 * Basically an index over {@link TlEntry[]}
 */
export interface TlFullSchema {
    /**
     * Entries in the schema
     */
    entries: TlEntry[]

    /**
     * Index of classes by name
     */
    classes: Record<string, TlEntry>

    /**
     * Index of methods by name
     */
    methods: Record<string, TlEntry>

    /**
     * Index of unions by name
     */
    unions: Record<string, TlUnion>
}

/**
 * A TL error
 */
export interface TlError {
    /**
     * Error code
     */
    code: number

    /**
     * Error name
     */
    name: string

    /**
     * Description of the error
     */
    description?: string

    /**
     * Whether this is a "virtual" error (only thrown by mtcute itself)
     */
    virtual?: true

    // internal fields used by generator

    /** @hidden */
    _auto?: true
    /** @hidden */
    _paramNames?: string[]
}

/**
 * TL errors information
 */
export interface TlErrors {
    /**
     * Base errors
     */
    base: TlError[]

    /**
     * Index of errors by name
     */
    errors: Record<string, TlError>

    /**
     * Object describing which errors may be thrown by which methods
     *
     * Mapping from method name to array of error names
     */
    throws: Record<string, string[]>

    /**
     * Index of the methods only usable by user
     */
    userOnly: Record<string, 1>
}

/**
 * Basic difference type
 *
 * @typeParam T  Type that is being diff-ed
 * @typeParam K  Information about the modifications
 */
export interface BasicDiff<T, K> {
    /**
     * Added elements
     */
    added: T[]

    /**
     * Removed elements
     */
    removed: T[]

    /**
     * Modified elements
     */
    modified: K[]
}

/**
 * A simple old/new difference for a single property
 *
 * @typeParam T  Type of the property
 */
export interface PropertyDiff<T> {
    /**
     * Old value of the property
     */
    old: T

    /**
     * New value of the property
     */
    new: T
}

/**
 * Difference of a single argument
 */
export interface TlArgumentDiff {
    /**
     * Name of the argument
     */
    name: string

    /**
     * Type of the argument diff
     */
    type?: PropertyDiff<string>

    /**
     * Predicate of the argument diff
     */
    predicate?: PropertyDiff<string | undefined>

    /**
     * Comment of the argument diff
     */
    comment?: PropertyDiff<string | undefined>
}

/**
 * Difference of a single entry
 */
export interface TlEntryDiff {
    /**
     * Name of the entry
     */
    name: string

    /**
     * Constructor ID of the entry diff
     */
    id?: PropertyDiff<number>

    /**
     * Generic types diff
     */
    generics?: PropertyDiff<TlGeneric[] | undefined>

    /**
     * Arguments of the entry diff
     */
    arguments?: BasicDiff<TlArgument, TlArgumentDiff>

    /**
     * Comment of the entry diff
     */
    comment?: PropertyDiff<string | undefined>
}

/**
 * Difference of a single union
 */
export interface TlUnionDiff {
    /**
     * Name of the union
     */
    name: string

    /**
     * Difference in union classes
     */
    classes: BasicDiff<TlEntry, never>

    /**
     * Difference in union methods
     */
    methods: BasicDiff<TlEntry, never>
}

/**
 * Difference between two TL schemas
 */
export interface TlSchemaDiff {
    /**
     * Difference in classes
     */
    classes: BasicDiff<TlEntry, TlEntryDiff>

    /**
     * Difference in methods
     */
    methods: BasicDiff<TlEntry, TlEntryDiff>

    /**
     * Difference in unions
     */
    unions: BasicDiff<TlUnion, TlUnionDiff>
}

/**
 * Index of TL primitive types
 */
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
    Object: true,
} as const
