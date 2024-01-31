import { MtArgumentError } from '../../../types/errors.js'
import { links } from '../../../utils/links/index.js'
import { toggleChannelIdMark } from '../../../utils/peer-utils.js'
import { ITelegramClient } from '../../client.types.js'
import { Message } from '../../types/messages/index.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _getDiscussionMessage } from './get-discussion-message.js'
import { getMessages } from './get-messages.js'

/**
 * Given a message link (e.g. `t.me/durov/1`), fetch the relevant message.
 */
export async function getMessageByLink(client: ITelegramClient, link: string): Promise<Message | null> {
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
