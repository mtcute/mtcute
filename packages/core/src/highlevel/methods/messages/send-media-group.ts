import { tl } from '@mtcute/tl'

import { randomLong } from '../../../utils/long-utils.js'
import { ITelegramClient } from '../../client.types.js'
import { InputMediaLike } from '../../types/media/input-media/types.js'
import { Message } from '../../types/messages/message.js'
import { InputPeerLike, PeersIndex } from '../../types/peers/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { _normalizeInputText } from '../misc/normalize-text.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _maybeInvokeWithBusinessConnection } from './_business-connection.js'
import { _getDiscussionMessage } from './get-discussion-message.js'
import { _processCommonSendParameters, CommonSendParams } from './send-common.js'

/**
 * Send a group of media.
 *
 * To add a caption to the group, add caption to the first
 * media in the group and don't add caption for any other.
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param medias  Medias contained in the message.
 * @param params  Additional sending parameters
 * @link InputMedia
 */
export async function sendMediaGroup(
    client: ITelegramClient,
    chatId: InputPeerLike,
    medias: (InputMediaLike | string)[],
    params?: CommonSendParams & {
        /**
         * Whether to invert media position.
         *
         * Currently only supported for web previews and makes the
         * client render the preview above the caption and not below.
         */
        invertMedia?: boolean

        /**
         * Function that will be called after some part has been uploaded.
         * Only used when a file that requires uploading is passed,
         * and not used when uploading a thumbnail.
         *
         * @param index  Index of the media in the original array
         * @param uploaded  Number of bytes already uploaded
         * @param total  Total file size
         */
        progressCallback?: (index: number, uploaded: number, total: number) => void
    },
): Promise<Message[]> {
    if (!params) params = {}

    const { peer, replyTo, scheduleDate, chainId, quickReplyShortcut } = await _processCommonSendParameters(
        client,
        chatId,
        params,
    )

    const multiMedia: tl.RawInputSingleMedia[] = []

    for (let i = 0; i < medias.length; i++) {
        let media = medias[i]

        if (typeof media === 'string') {
            media = {
                type: 'auto',
                file: media,
            }
        }

        const inputMedia = await _normalizeInputMedia(
            client,
            media,
            {
                progressCallback: params.progressCallback?.bind(null, i),
                // i have no fucking clue why we should upload it manually,
                // but otherwise Telegram throws MEDIA_INVALID
                // fuck my life
                uploadPeer: peer,
                businessConnectionId: params.businessConnectionId,
            },
            true,
        )

        const [message, entities] = await _normalizeInputText(
            client,
            // some types dont have `caption` field, and ts warns us,
            // but since it's JS, they'll just be `undefined` and properly handled by the method
            (media as Extract<typeof media, { caption?: unknown }>).caption,
        )

        multiMedia.push({
            _: 'inputSingleMedia',
            randomId: randomLong(),
            media: inputMedia,
            message,
            entities,
        })
    }

    const res = await _maybeInvokeWithBusinessConnection(
        client,
        params.businessConnectionId,
        {
            _: 'messages.sendMultiMedia',
            peer,
            multiMedia,
            silent: params.silent,
            replyTo,
            scheduleDate,
            clearDraft: params.clearDraft,
            noforwards: params.forbidForwards,
            sendAs: params.sendAs ? await resolvePeer(client, params.sendAs) : undefined,
            invertMedia: params.invertMedia,
            quickReplyShortcut,
            effect: params.effect,
        },
        { chainId },
    )

    assertIsUpdatesGroup('sendMediaGroup', res)
    client.handleClientUpdate(res)

    const peers = PeersIndex.from(res)

    const msgs = res.updates
        .filter(
            (u): u is tl.RawUpdateNewMessage | tl.RawUpdateNewChannelMessage | tl.RawUpdateNewScheduledMessage =>
                u._ === 'updateNewMessage' || u._ === 'updateNewChannelMessage' || u._ === 'updateNewScheduledMessage',
        )
        .map((u) => new Message(u.message, peers, u._ === 'updateNewScheduledMessage'))

    return msgs
}
