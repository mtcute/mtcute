import { TelegramClient } from '../../client'
import {
    InputPeerLike,
    MtArgumentError,
    MtTypeAssertionError,
    PeersIndex,
    Poll,
} from '../../types'
import { MaybeArray, MessageNotFoundError } from '@mtcute/core'
import { assertTypeIs } from '../../utils/type-assertion'
import { assertIsUpdatesGroup } from '../../utils/updates-utils'

/**
 * Send or retract a vote in a poll.
 *
 * @param chatId  Chat ID where this poll was found
 * @param message  Message ID where this poll was found
 * @param options
 *     Selected options, or `null` to retract.
 *     You can pass indexes of the answers or the `Buffer`s
 *     representing them. In case of indexes, the poll will first
 *     be requested from the server.
 * @internal
 */
export async function sendVote(
    this: TelegramClient,
    chatId: InputPeerLike,
    message: number,
    options: null | MaybeArray<number | Buffer>
): Promise<Poll> {
    if (options === null) options = []
    if (!Array.isArray(options)) options = [options]

    const peer = await this.resolvePeer(chatId)

    let poll: Poll | undefined = undefined
    if (options.some((it) => typeof it === 'number')) {
        const msg = await this.getMessages(peer, message)

        if (!msg) throw new MessageNotFoundError()

        if (!(msg.media instanceof Poll))
            throw new MtArgumentError(
                'This message does not contain a poll'
            )

        poll = msg.media
        options = options.map((opt) => {
            if (typeof opt === 'number') {
                return poll!.raw.answers[opt].option
            }
            return opt
        })
    }

    const res = await this.call({
        _: 'messages.sendVote',
        peer,
        msgId: message,
        options: options as Buffer[],
    })

    assertIsUpdatesGroup('messages.sendVote', res)

    this._handleUpdate(res, true)

    const upd = res.updates[0]
    assertTypeIs('messages.sendVote (@ .updates[0])', upd, 'updateMessagePoll')
    if (!upd.poll) {
        throw new MtTypeAssertionError(
            'messages.sendVote (@ .updates[0].poll)',
            'poll',
            'undefined'
        )
    }

    const peers = PeersIndex.from(res)

    return new Poll(this, upd.poll, peers, upd.results)
}
