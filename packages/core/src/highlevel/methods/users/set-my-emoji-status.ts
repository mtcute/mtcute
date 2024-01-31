import { tl } from '@mtcute/tl'

import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { normalizeDate } from '../../utils/index.js'

/**
 * Set an emoji status for the current user
 *
 * @param emoji  Custom emoji ID or `null` to remove the emoji
 */
export async function setMyEmojiStatus(
    client: ITelegramClient,
    emoji: tl.Long | null,
    params?: {
        /**
         * Date when the emoji status should expire (only if `emoji` is not `null`)
         */
        until?: number | Date
    },
): Promise<void> {
    const { until } = params ?? {}

    let emojiStatus: tl.TypeEmojiStatus

    if (emoji === null) {
        emojiStatus = { _: 'emojiStatusEmpty' }
    } else if (until) {
        emojiStatus = {
            _: 'emojiStatusUntil',
            documentId: emoji,
            until: normalizeDate(until),
        }
    } else {
        emojiStatus = {
            _: 'emojiStatus',
            documentId: emoji,
        }
    }

    const r = await client.call({
        _: 'account.updateEmojiStatus',
        emojiStatus,
    })

    assertTrue('account.updateEmojiStatus', r)
}
