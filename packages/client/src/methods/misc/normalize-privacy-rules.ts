import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPrivacyRule } from '../../types'
import { normalizeToInputUser } from '../../utils'

/**
 * Normalize {@link InputPrivacyRule}[] to `tl.TypeInputPrivacyRule`,
 * resolving the peers if needed.
 *
 * @internal
 */
export async function _normalizePrivacyRules(
    this: TelegramClient,
    rules: InputPrivacyRule[],
): Promise<tl.TypeInputPrivacyRule[]> {
    const res: tl.TypeInputPrivacyRule[] = []

    for (const rule of rules) {
        if ('_' in rule) {
            res.push(rule)
            continue
        }

        if ('users' in rule) {
            const users = await this.resolvePeerMany(rule.users, normalizeToInputUser)

            res.push({
                _: rule.allow ? 'inputPrivacyValueAllowUsers' : 'inputPrivacyValueDisallowUsers',
                users,
            })
            continue
        }

        if ('chats' in rule) {
            const chats = await this.resolvePeerMany(rule.chats)

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
