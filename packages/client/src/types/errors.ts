/**
 * Base class for all `@mtqt/client` errors
 */
import { InputPeerLike } from './peers'

export class MtqtError extends Error {}

/**
 * Method invocation was invalid because some argument
 * passed was invalid.
 */
export class MtqtArgumentError extends MtqtError {}

/**
 * Could not find peer by provided information
 */
export class MtqtNotFoundError extends MtqtError {}

/**
 * Either you requested or the server returned something
 * that is not (yet) supported.
 *
 * Stay tuned for future updates!
 */
export class MtqtUnsupportedError extends MtqtError {}

/**
 * Server returned something of an unexpected type.
 *
 * This is usually a problem on library side.
 * Feel free to open an issue about this!
 */
export class MtqtTypeAssertionError extends MtqtError {
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
        this.context = context
        this.expected = expected
        this.actual = actual
    }
}

/**
 * Some method that requires a particular type of peer
 * is called, but the resolved peer type is invalid.
 *
 * For example, when trying to get common chats
 * while providing another chat as `userId`
 */
export class MtqtInvalidPeerTypeError extends MtqtError {
    constructor(peer: InputPeerLike, expected: string) {
        super(
            `Provided identifier ${JSON.stringify(peer)} is not a ${expected}`
        )
    }
}

/**
 * Trying to access to some property on an object that does not
 * contain that information.
 */
export class MtqtEmptyError extends MtqtError {
    constructor() {
        super('Property is not available on an empty object')
    }
}
