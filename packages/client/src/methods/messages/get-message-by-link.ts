import { BaseTelegramClient, MtArgumentError, toggleChannelIdMark } from '@mtcute/core'
import { links } from '@mtcute/core/utils.js'

import { Message } from '../../index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _getDiscussionMessage } from './get-discussion-message.js'
import { getMessages } from './get-messages.js'

/**
 * Given a message link (e.g. `t.me/durov/1`), fetch the relevant message.
 */
export async function getMessageByLink(client: BaseTelegramClient, link: string): Promise<Message | null> {
    const parsed = links.message.parse(link)

    if (!parsed) {
        throw new MtArgumentError(`Invalid message link: ${link}`)
    }

    let peer

    if ('username' in parsed) {
        peer = await resolvePeer(client, parsed.username)
    } else {
        peer = await resolvePeer(client, toggleChannelIdMark(parsed.channelId))
    }

    let msgId = parsed.id

    if (parsed.commentId) {
        [peer] = await _getDiscussionMessage(client, peer, parsed.id)
        msgId = parsed.commentId
    }

    const [msg] = await getMessages(client, peer, msgId)

    return msg
}
