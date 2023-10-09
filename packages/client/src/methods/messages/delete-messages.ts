import { BaseTelegramClient, tl } from '@mtcute/core'

import { InputPeerLike, Message } from '../../types'
import { isInputPeerChannel, normalizeToInputChannel } from '../../utils/peer-utils'
import { createDummyUpdate } from '../../utils/updates-utils'
import { resolvePeer } from '../users/resolve-peer'
import { deleteScheduledMessages } from './delete-scheduled-messages'

// @exported
export interface DeleteMessagesParams {
    /**
     * Whether to "revoke" (i.e. delete for both sides).
     * Only used for chats and private chats.
     *
     * @default  true
     */
    revoke?: boolean
}

/**
 * Delete messages by their IDs
 *
 * @param chatId  Chat's marked ID, its username, phone or `"me"` or `"self"`.
 * @param ids  Message(s) ID(s) to delete.
 */
export async function deleteMessagesById(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    ids: number[],
    params?: DeleteMessagesParams,
): Promise<void> {
    const { revoke = true } = params ?? {}

    const peer = await resolvePeer(client, chatId)

    let upd

    if (isInputPeerChannel(peer)) {
        const channel = normalizeToInputChannel(peer)
        const res = await client.call({
            _: 'channels.deleteMessages',
            channel,
            id: ids,
        })
        upd = createDummyUpdate(res.pts, res.ptsCount, peer.channelId)
    } else {
        const res = await client.call({
            _: 'messages.deleteMessages',
            id: ids,
            revoke,
        })
        upd = createDummyUpdate(res.pts, res.ptsCount)
    }

    client.network.handleUpdate(upd)
}

/**
 * Delete one or more {@link Message}
 *
 * @param messages  Message(s) to delete
 */
export async function deleteMessages(
    client: BaseTelegramClient,
    messages: Message[],
    params?: DeleteMessagesParams,
): Promise<void> {
    if (messages.length === 1) {
        return deleteMessagesById(client, messages[0].chat.inputPeer, [messages[0].id], params)
    }

    const byChat = new Map<number, [tl.TypeInputPeer, number[]]>()
    const byChatScheduled = new Map<number, [tl.TypeInputPeer, number[]]>()

    for (const msg of messages) {
        const map = msg.isScheduled ? byChatScheduled : byChat

        if (!map.has(msg.chat.id)) {
            map.set(msg.chat.id, [msg.chat.inputPeer, []])
        }
        map.get(msg.chat.id)![1].push(msg.id)
    }

    for (const [peer, ids] of byChat.values()) {
        await deleteMessagesById(client, peer, ids, params)
    }

    for (const [peer, ids] of byChatScheduled.values()) {
        await deleteScheduledMessages(client, peer, ids)
    }
}
