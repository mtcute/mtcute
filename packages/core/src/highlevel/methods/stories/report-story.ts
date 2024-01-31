import { tl } from '@mtcute/tl'

import { MaybeArray } from '../../../types/utils.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Report a story (or multiple stories) to the moderation team
 */
export async function reportStory(
    client: ITelegramClient,
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

    const r = await client.call({
        _: 'stories.report',
        peer: await resolvePeer(client, peerId),
        id: Array.isArray(storyIds) ? storyIds : [storyIds],
        message,
        reason,
    })

    assertTrue('stories.report', r)
}
