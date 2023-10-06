import { Long, MtTypeAssertionError } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { InputPeerLike, PeersIndex, Poll } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Close a poll sent by you.
 *
 * Once closed, poll can't be re-opened, and nobody
 * will be able to vote in it
 *
 * @internal
 */
export async function closePoll(
    this: TelegramClient,
    params: {
        /** Chat ID where this poll was found */
        chatId: InputPeerLike
        /** Message ID where this poll was found */
        message: number
    },
): Promise<Poll> {
    const { chatId, message } = params

    const res = await this.call({
        _: 'messages.editMessage',
        peer: await this.resolvePeer(chatId),
        id: message,
        media: {
            _: 'inputMediaPoll',
            poll: {
                _: 'poll',
                id: Long.ZERO,
                closed: true,
                question: '',
                answers: [],
            },
        },
    })

    assertIsUpdatesGroup('messages.editMessage', res)

    this._handleUpdate(res, true)

    const upd = res.updates[0]
    assertTypeIs('messages.editMessage (@ .updates[0])', upd, 'updateMessagePoll')

    if (!upd.poll) {
        throw new MtTypeAssertionError('messages.editMessage (@ .updates[0].poll)', 'poll', 'undefined')
    }

    const peers = PeersIndex.from(res)

    return new Poll(this, upd.poll, peers, upd.results)
}
