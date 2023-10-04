import { MaybeArray, tl } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { InputPeerLike } from '../../types'

/**
 * Report a story (or multiple stories) to the moderation team
 *
 * @internal
 */
export async function reportStory(
    this: TelegramClient,
    peerId: InputPeerLike,
    storyIds: MaybeArray<number>,
    params?: {
        /**
         * Reason for reporting
         *
         * @default  inputReportReasonSpam
         */
        reason?: tl.TypeReportReason

        /**
         * Additional comment to the report
         */
        message?: string
    },
): Promise<void> {
    const { reason = { _: 'inputReportReasonSpam' }, message = '' } = params ?? {}

    await this.call({
        _: 'stories.report',
        peer: await this.resolvePeer(peerId),
        id: Array.isArray(storyIds) ? storyIds : [storyIds],
        message,
        reason,
    })
}
