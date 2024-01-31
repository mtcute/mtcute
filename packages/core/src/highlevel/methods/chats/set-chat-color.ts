import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, MtInvalidPeerTypeError } from '../../types/index.js'
import { isInputPeerChannel, isInputPeerUser, toInputChannel } from '../../utils/index.js'
import { isSelfPeer } from '../auth/utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=user
/**
 * Set peer color and optionally background pattern
 */
export async function setChatColor(
    client: ITelegramClient,
    params: {
        /**
         * Peer where to update the color.
         *
         * By default will change the color for the current user
         */
        peer?: InputPeerLike

        /**
         * Color identificator
         *
         * Note that this value is **not** an RGB color representation. Instead, it is
         * a number which should be used to pick a color from a predefined
         * list of colors:
         *  - `0-6` are the default colors used by Telegram clients:
         *    `red, orange, purple, green, sea, blue, pink`
         *  - `>= 7` are returned by `help.getAppConfig`.
         */
        color: number

        /**
         * Background pattern emoji ID.
         *
         * Must be an adaptive emoji, otherwise the request will fail.
         */
        backgroundEmojiId?: tl.Long

        /**
         * Whether to set this color for the profile
         * header instead of chat name/replies.
         *
         * Currently only available for the current user.
         */
        forProfile?: boolean
    },
): Promise<void> {
    const { color, backgroundEmojiId, forProfile } = params
    const peer = await resolvePeer(client, params.peer ?? 'me')

    if (isInputPeerChannel(peer)) {
        const res = await client.call({
            _: 'channels.updateColor',
            channel: toInputChannel(peer),
            color,
            backgroundEmojiId,
        })

        client.handleClientUpdate(res)

        return
    }

    if (isInputPeerUser(peer)) {
        if (!isSelfPeer(client, peer)) {
            throw new MtTypeAssertionError('setChatColor', 'self', peer._)
        }

        const r = await client.call({
            _: 'account.updateColor',
            color,
            backgroundEmojiId,
            forProfile,
        })

        assertTrue('account.updateColor', r)
    }

    throw new MtInvalidPeerTypeError(peer, 'channel | user')
}
