import { BaseTelegramClient, Long, MtTypeAssertionError } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { InputPeerLike, PeersIndex, Poll } from '../../types'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'
import { resolvePeer } from '../users/resolve-peer'

/**
 * Close a poll sent by you.
 *
 * Once closed, poll can't be re-opened, and nobody
 * will be able to vote in it
 */
export async function closePoll(
    client: BaseTelegramClient,
    params: {
        /** Chat ID where this poll was found */
        chatId: InputPeerLike
        /** Message ID where this poll was found */
        message: number
    },
): Promise<Poll> {
    const { chatId, message } = params

    const res = await client.call({
        _: 'messages.editMessage',
        peer: await resolvePeer(client, chatId),
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

    client.network.handleUpdate(res, true)

    const upd = res.updates[0]
    assertTypeIs('messages.editMessage (@ .updates[0])', upd, 'updateMessagePoll')

    if (!upd.poll) {
        throw new MtTypeAssertionError('messages.editMessage (@ .updates[0].poll)', 'poll', 'undefined')
    }

    const peers = PeersIndex.from(res)

    return new Poll(upd.poll, peers, upd.results)
}
