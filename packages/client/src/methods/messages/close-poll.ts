import { TelegramClient } from '../../client'
import { InputPeerLike, MtqtTypeAssertionError, Poll } from '../../types'
import { createUsersChatsIndex } from '../../utils/peer-utils'
import bigInt from 'big-integer'
import { assertTypeIs } from '../../utils/type-assertion'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

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
        peer: await this.resolvePeer(chatId),
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

    assertIsUpdatesGroup('messages.editMessage', res)

    this._handleUpdate(res, true)

    const upd = res.updates[0]
    assertTypeIs(
        'messages.editMessage (@ .updates[0])',
        upd,
        'updateMessagePoll'
    )
    if (!upd.poll) {
        throw new MtqtTypeAssertionError(
            'messages.editMessage (@ .updates[0].poll)',
            'poll',
            'undefined'
        )
    }

    const { users } = createUsersChatsIndex(res)

    return new Poll(this, upd.poll, users, upd.results)
}
