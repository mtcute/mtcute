import { assertNever, Long, tl } from '@mtcute/core'
import { assertTypeIs } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { ArrayWithTotal, ChatMember, InputPeerLike, MtInvalidPeerTypeError, PeersIndex } from '../../types'
import { makeArrayWithTotal } from '../../utils'
import { isInputPeerChannel, isInputPeerChat, normalizeToInputChannel } from '../../utils/peer-utils'

/**
 * Get a chunk of members of some chat.
 *
 * You can retrieve up to 200 members at once
 *
 * @param chatId  Chat ID or username
 * @param params  Additional parameters
 * @internal
 */
export async function getChatMembers(
    this: TelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Search query to filter members by their display names and usernames
         * Defaults to `''` (empty string)
         *
         * > **Note**: Only used for these values of `filter`:
         * > `all, banned, restricted, mention, contacts`
         */
        query?: string

        /**
         * Sequential number of the first member to be returned.
         */
        offset?: number

        /**
         * Maximum number of members to be retrieved.
         *
         * > **Note**: Telegram currently only allows you to ever retrieve at most
         * > 200 members, regardless of offset/limit. I.e. when passing
         * > `offset=201` nothing will ever be returned.
         *
         * @default  200
         */
        limit?: number

        /**
         * Type of the query. Can be:
         *  - `all`: get all members
         *  - `banned`: get only banned members
         *  - `restricted`: get only restricted members
         *  - `bots`: get only bots
         *  - `recent`: get recent members
         *  - `admins`: get only administrators (and creator)
         *  - `contacts`: get only contacts
         *  - `mention`: get users that can be mentioned (see {@link tl.RawChannelParticipantsMentions})
         *
         *  Only used for channels and supergroups. Defaults to `recent`
         */
        type?: 'all' | 'banned' | 'restricted' | 'bots' | 'recent' | 'admins' | 'contacts' | 'mention'
    },
): Promise<ArrayWithTotal<ChatMember>> {
    const { query = '', offset = 0, limit = 200, type = 'recent' } = params ?? {}

    const chat = await this.resolvePeer(chatId)

    if (isInputPeerChat(chat)) {
        const res = await this.call({
            _: 'messages.getFullChat',
            chatId: chat.chatId,
        })

        assertTypeIs('getChatMember (@ messages.getFullChat)', res.fullChat, 'chatFull')

        let members =
            res.fullChat.participants._ === 'chatParticipantsForbidden' ? [] : res.fullChat.participants.participants

        if (offset) members = members.slice(offset)
        if (limit) members = members.slice(0, limit)

        const peers = PeersIndex.from(res)

        const ret = members.map((m) => new ChatMember(this, m, peers))

        return makeArrayWithTotal(ret, ret.length)
    }

    if (isInputPeerChannel(chat)) {
        const q = query

        let filter: tl.TypeChannelParticipantsFilter

        switch (type) {
            case 'all':
                filter = { _: 'channelParticipantsSearch', q }
                break
            case 'banned':
                filter = { _: 'channelParticipantsKicked', q }
                break
            case 'restricted':
                filter = { _: 'channelParticipantsBanned', q }
                break
            case 'mention':
                filter = { _: 'channelParticipantsMentions', q }
                break
            case 'bots':
                filter = { _: 'channelParticipantsBots' }
                break
            case 'recent':
                filter = { _: 'channelParticipantsRecent' }
                break
            case 'admins':
                filter = { _: 'channelParticipantsAdmins' }
                break
            case 'contacts':
                filter = { _: 'channelParticipantsContacts', q }
                break
            default:
                assertNever(type)
        }

        const res = await this.call({
            _: 'channels.getParticipants',
            channel: normalizeToInputChannel(chat),
            filter,
            offset,
            limit,
            hash: Long.ZERO,
        })

        assertTypeIs('getChatMembers (@ channels.getParticipants)', res, 'channels.channelParticipants')

        const peers = PeersIndex.from(res)

        const ret = res.participants.map((i) => new ChatMember(this, i, peers)) as ArrayWithTotal<ChatMember>

        return makeArrayWithTotal(ret, res.count)
    }

    throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
}
