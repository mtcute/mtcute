import type { InputPeerLike } from '../peers/index.js'
import type { Message } from './message.js'

/**
 * Parameters for methods that accept a message
 *
 * Either a message object (in `message` field), or a chat ID and a message ID
 */
export type InputMessageId = { chatId: InputPeerLike; message: number } | { message: Message }

/** Remove {@link InputMessageId} type from the given type */
export type OmitInputMessageId<T> = Omit<T, 'chatId' | 'message'>

/** @internal */
export function normalizeInputMessageId(id: InputMessageId) {
    if ('chatId' in id) return id

    return { chatId: id.message.chat.inputPeer, message: id.message.id }
}
