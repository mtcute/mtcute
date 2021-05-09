import { TelegramClient } from '../../client'
import { InputPeerLike, MtCuteTypeAssertionError, Poll } from '../../types'
import { tl } from '@mtcute/tl'
import {
    createUsersChatsIndex,
    normalizeToInputPeer,
} from '../../utils/peer-utils'
import bigInt from 'big-integer'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Close a poll sent by you.
 *
 * Once closed, poll can't be re-opened, and nobody
 * will be able to vote in it
 *
 * @param chatId  Chat ID where this poll was found
 * @param message  Message ID where this poll was found
 * @internal
 */
export async function closePoll(
    this: TelegramClient,
    chatId: InputPeerLike,
    message: number
): Promise<Poll> {
    const res = await this.call({
        _: 'messages.editMessage',
        peer: normalizeToInputPeer(await this.resolvePeer(chatId)),
        id: message,
        media: {
            _: 'inputMediaPoll',
            poll: {
                _: 'poll',
                id: bigInt.zero,
                closed: true,
                question: '',
                answers: [],
            },
        },
    })

    if (!(res._ === 'updates' || res._ === 'updatesCombined'))
        throw new MtCuteTypeAssertionError(
            '_findMessageInUpdate',
            'updates | updatesCombined',
            res._
        )

    this._handleUpdate(res, true)

    const upd = res.updates[0]
    assertTypeIs('closePoll (@ messages.editMessage)', upd, 'updateMessagePoll')
    if (!upd.poll) {
        throw new MtCuteTypeAssertionError(
            'closePoll (@ messages.editMessage)',
            'poll',
            'undefined'
        )
    }

    const { users } = createUsersChatsIndex(res)

    return new Poll(this, upd.poll, users, upd.results)
}