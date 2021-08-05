import {
    ChatMember,
    InputPeerLike,
    MtInvalidPeerTypeError,
} from '../../types'
import { TelegramClient } from '../../client'
import {
    createUsersChatsIndex,
    isInputPeerChannel,
    isInputPeerChat,
    normalizeToInputChannel,
} from '../../utils/peer-utils'
import { assertTypeIs } from '../../utils/type-assertion'
import { tl } from '@mtcute/tl'
import { ArrayWithTotal } from '../../types'

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
         * > `all`, `banned`, `restricted`, `contacts`
         */
        query?: string

        /**
         * Sequential number of the first member to be returned.
         */
        offset?: number

        /**
         * Maximum number of members to be retrieved. Defaults to `200`
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
         *  - `mention`: get users that can be mentioned ([learn more](https://mt.tei.su/tl/class/channelParticipantsMentions))
         *
         *  Only used for channels and supergroups. Defaults to `recent`
         */
        type?:
            | 'all'
            | 'banned'
            | 'restricted'
            | 'bots'
            | 'recent'
            | 'admins'
            | 'contacts'
            | 'mention'
    }
): Promise<ArrayWithTotal<ChatMember>> {
    if (!params) params = {}

    const chat = await this.resolvePeer(chatId)

    if (isInputPeerChat(chat)) {
        const res = await this.call({
            _: 'messages.getFullChat',
            chatId: chat.chatId,
        })

        assertTypeIs(
            'getChatMember (@ messages.getFullChat)',
            res.fullChat,
            'chatFull'
        )

        let members =
            res.fullChat.participants._ === 'chatParticipantsForbidden'
                ? []
                : res.fullChat.participants.participants

        if (params.offset) members = members.slice(params.offset)
        if (params.limit) members = members.slice(0, params.limit)

        const { users } = createUsersChatsIndex(res)

        const ret = members.map((m) => new ChatMember(this, m, users)) as ArrayWithTotal<ChatMember>

        ret.total = ret.length
        return ret
    }

    if (isInputPeerChannel(chat)) {
        const q = params.query?.toLowerCase() ?? ''
        const type = params.type ?? 'recent'

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
        }

        const res = await this.call({
            _: 'channels.getParticipants',
            channel: normalizeToInputChannel(chat),
            filter,
            offset: params.offset ?? 0,
            limit: params.limit ?? 200,
            hash: 0,
        })

        assertTypeIs(
            'getChatMembers (@ channels.getParticipants)',
            res,
            'channels.channelParticipants'
        )

        const { users } = createUsersChatsIndex(res)

        const ret = res.participants.map((i) => new ChatMember(this, i, users)) as ArrayWithTotal<ChatMember>
        ret.total = res.count
        return ret
    }

    throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
}
