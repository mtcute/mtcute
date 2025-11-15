/**
 * Modifiers for {@link TlArgument.type}
 */
export interface TlTypeModifiers {
  /**
   * Predicate of the argument
   * @example `flags.3`
   */
  predicate?: string

  /**
   * Whether `type` is in fact a `Vector`
   * @example `type=long, isVector=true => Vector<long>
   */
  isVector?: boolean

  /**
   * Whether `type` is in fact a `vector` (a bare vector, not to be confused with `Vector`).
   *
   * The difference between `Vector<T>` and `vector<T>` is that in the latter case
   * constructor ID of the vector itself (1cb5c415) is omitted
   *
   * @example `type=long, isVector=false, isBareVector=true => vector<long>
   */
  isBareVector?: boolean

  /**
   * Whether `type` is in fact a "bare" type (a %-prefixed type) from within a union.
   *
   * The difference between `T` and `%T` is that in the latter case
   * constructor ID of `T` is omitted.
   *
   * Note: If there are more than 1 types within that union, this syntax is not valid.
   *
   * @example `type=Message, isBare=true => %Message
   */
  isBareUnion?: boolean

  /**
   * Whether `type` is in fact a "bare" type (a %-prefixed type)
   *
   * The difference between `T` and `%T` is that in the latter case
   * constructor ID of `T` is omitted.
   *
   * The difference with {@link isBareUnion} is in the kind of `type`.
   * For {@link isBareUnion}, `type` is a name of a union (e.g. `Message`),
   * for {@link isBareType} it is a name of a type (e.g. `message`).
   */
  isBareType?: boolean

  /**
   * For simplicity, when {@link isBareUnion} or {@link isBareType} is true,
   * this field contains the constructor ID of the type being referenced.
   *
   * May still be undefined if the constructor ID is not known.
   */
  constructorId?: number
}

/**
 * An argument of a TL entry
 */
export interface TlArgument {
  /**
   * Name of the argument
   */
  name: string

  /**
   * Type of the argument. Usually a name of a Union, but not always
   */
  type: string

  /**
   * Modifiers for {@link type}
   */
  typeModifiers?: TlTypeModifiers

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
   * For methods (where {@link type} is the return type), modifiers for {@link type}
   */
  typeModifiers?: TlTypeModifiers

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
   * Base errors (map of error names to error code, e.g. `BAD_REQUEST: 400`)
   */
  base: Record<string, number>

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

  /**
   * Index of the methods only usable by bots
   */
  botOnly: Record<string, 1>
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
  Object: 1,
} as const
