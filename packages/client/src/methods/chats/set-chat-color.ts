import { BaseTelegramClient, MtTypeAssertionError, tl } from '@mtcute/core'

import { InputPeerLike, MtInvalidPeerTypeError } from '../../types/index.js'
import { isInputPeerChannel, isInputPeerUser, normalizeToInputChannel } from '../../utils/index.js'
import { getAuthState } from '../auth/_state.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @available=user
/**
 * Set chat name/replies color and optionally background pattern
 */
export async function setChatColor(
    client: BaseTelegramClient,
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
    },
): Promise<void> {
    const { color, backgroundEmojiId } = params
    const peer = await resolvePeer(client, params.peer ?? 'me')

    if (isInputPeerChannel(peer)) {
        const res = await client.call({
            _: 'channels.updateColor',
            channel: normalizeToInputChannel(peer),
            color,
            backgroundEmojiId,
        })

        client.network.handleUpdate(res)

        return
    }

    if (isInputPeerUser(peer)) {
        if (peer._ !== 'inputPeerSelf' && peer.userId !== getAuthState(client).userId) {
            throw new MtTypeAssertionError('setChatColor', 'inputPeerSelf | inputPeerUser', peer._)
        }

        await client.call({
            _: 'account.updateColor',
            color,
            backgroundEmojiId,
        })
    }

    throw new MtInvalidPeerTypeError(peer, 'channel | user')
}
