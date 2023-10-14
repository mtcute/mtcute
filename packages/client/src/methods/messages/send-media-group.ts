import { BaseTelegramClient, tl } from '@mtcute/core'
import { randomLong } from '@mtcute/core/utils.js'

import { InputMediaLike } from '../../types/media/input-media.js'
import { Message } from '../../types/messages/message.js'
import { InputPeerLike, PeersIndex } from '../../types/peers/index.js'
import { normalizeDate } from '../../utils/misc-utils.js'
import { assertIsUpdatesGroup } from '../../utils/updates-utils.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _getDiscussionMessage } from './get-discussion-message.js'
import { _parseEntities } from './parse-entities.js'
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
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    medias: (InputMediaLike | string)[],
    params?: CommonSendParams & {
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

    const { peer, replyTo } = await _processCommonSendParameters(client, chatId, params)

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
            },
            true,
        )

        const [message, entities] = await _parseEntities(
            client,
            // some types dont have `caption` field, and ts warns us,
            // but since it's JS, they'll just be `undefined` and properly
            // handled by _parseEntities method
            (media as Extract<typeof media, { caption?: unknown }>).caption,
            params.parseMode,
            (media as Extract<typeof media, { entities?: unknown }>).entities,
        )

        multiMedia.push({
            _: 'inputSingleMedia',
            randomId: randomLong(),
            media: inputMedia,
            message,
            entities,
        })
    }

    const res = await client.call({
        _: 'messages.sendMultiMedia',
        peer,
        multiMedia,
        silent: params.silent,
        replyTo: replyTo ?
            {
                _: 'inputReplyToMessage',
                replyToMsgId: replyTo,
            } :
            undefined,
        scheduleDate: normalizeDate(params.schedule),
        clearDraft: params.clearDraft,
        noforwards: params.forbidForwards,
        sendAs: params.sendAs ? await resolvePeer(client, params.sendAs) : undefined,
    })

    assertIsUpdatesGroup('sendMediaGroup', res)
    client.network.handleUpdate(res, true)

    const peers = PeersIndex.from(res)

    const msgs = res.updates
        .filter(
            (u): u is tl.RawUpdateNewMessage | tl.RawUpdateNewChannelMessage | tl.RawUpdateNewScheduledMessage =>
                u._ === 'updateNewMessage' || u._ === 'updateNewChannelMessage' || u._ === 'updateNewScheduledMessage',
        )
        .map((u) => new Message(u.message, peers, u._ === 'updateNewScheduledMessage'))

    return msgs
}
