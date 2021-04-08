/**
 * Base class for all `@mtcute/client` errors
 */
import { InputPeerLike } from './peers'

export class MtCuteError extends Error {}

/**
 * Method invocation was invalid because some argument
 * passed was invalid.
 */
export class MtCuteArgumentError extends MtCuteError {}

/**
 * Could not find peer by provided information
 */
export class MtCuteNotFoundError extends MtCuteError {}

/**
 * Either you requested or the server returned something
 * that is not (yet) supported.
 *
 * Stay tuned for future updates!
 */
export class MtCuteUnsupportedError extends MtCuteError {}

/**
 * Server returned something of an unexpected type.
 */
export class MtCuteTypeAssertionError extends MtCuteError {
    /**
     * Context at which the error occurred.
     * Usually a user-friendly string containing name
     * of the high-level API method, name of the TL
     * RPC method, and path of the entity,
     * like this: `signIn (@ auth.signIn -> user)`
     */
    context: string

    /** Expected TL type */
    expected: string

    /** Actual TL type */
    actual: string

    constructor(context: string, expected: string, actual: string) {
        super(
            `Type assertion error at ${context}: expected ${expected}, but got ${actual}`
        )
    }
}

/**
 * Some method that requires a particular type of peer
 * is called, but the resolved peer type is invalid.
 *
 * For example, when trying to get common chats
 * while providing another chat as `userId`
 */
export class MtCuteInvalidPeerTypeError extends MtCuteError {
    constructor(peer: InputPeerLike, expected: string) {
        super(
            `Provided identifier ${JSON.stringify(peer)} is not a ${expected}`
        )
    }
}

/**
 * Trying to access to some property on an "empty" object.
 */
export class MtCuteEmptyError extends MtCuteError {
    constructor() {
        super('Property is not available on an empty object')
    }
}
