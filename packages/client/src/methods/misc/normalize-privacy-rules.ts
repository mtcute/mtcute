import { BaseTelegramClient, tl } from '@mtcute/core'

import { InputPrivacyRule } from '../../types/index.js'
import { normalizeToInputUser } from '../../utils/index.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'

/**
 * Normalize {@link InputPrivacyRule}[] to `tl.TypeInputPrivacyRule`,
 * resolving the peers if needed.
 */
export async function _normalizePrivacyRules(
    client: BaseTelegramClient,
    rules: InputPrivacyRule[],
): Promise<tl.TypeInputPrivacyRule[]> {
    const res: tl.TypeInputPrivacyRule[] = []

    for (const rule of rules) {
        if ('_' in rule) {
            res.push(rule)
            continue
        }

        if ('users' in rule) {
            const users = await resolvePeerMany(client, rule.users, normalizeToInputUser)

            res.push({
                _: rule.allow ? 'inputPrivacyValueAllowUsers' : 'inputPrivacyValueDisallowUsers',
                users,
            })
            continue
        }

        if ('chats' in rule) {
            const chats = await resolvePeerMany(client, rule.chats)

            res.push({
                _: rule.allow ? 'inputPrivacyValueAllowChatParticipants' : 'inputPrivacyValueDisallowChatParticipants',
                chats: chats.map((peer) => {
                    if ('channelId' in peer) return peer.channelId
                    if ('chatId' in peer) return peer.chatId

                    throw new Error('UNREACHABLE')
                }),
            })
            continue
        }
    }

    return res
}
