import { MtcuteError } from '../../types/errors.js'
import { InputPeerLike } from './peers/index.js'

/**
 * Could not find a peer by the provided information
 */
export class MtPeerNotFoundError extends MtcuteError {}

/**
 * Could not find a message by the provided information
 */
export class MtMessageNotFoundError extends MtcuteError {
    constructor(
        readonly peerId: number,
        readonly messageId: number,
        readonly context?: string,
    ) {
        super(`Message${context ? ' ' + context : ''} ${messageId} not found in ${peerId}`)
    }
}

/**
 * Some method that requires a particular type of peer
 * is called, but the resolved peer type is invalid.
 *
 * For example, when trying to get common chats
 * while providing another chat as `userId`
 */
export class MtInvalidPeerTypeError extends MtcuteError {
    constructor(peer: InputPeerLike, expected: string) {
        super(`Provided identifier ${JSON.stringify(peer)} is not a ${expected}`)
    }
}

/**
 * Trying to access to some property on an object that does not
 * contain that information.
 */
export class MtEmptyError extends MtcuteError {
    constructor() {
        super('Property is not available on an empty object')
    }
}
