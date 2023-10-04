import { assertNever, MtArgumentError } from '@mtcute/core'
import { assertTypeIs, assertTypeIsNot } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { InputMediaLike, InputPeerLike, MessageMedia, Photo, RawDocument } from '../../types'
import { parseDocument } from '../../types/media/document-utils'

/**
 * Upload a media to Telegram servers, without actually
 * sending a message anywhere. Useful when File ID is needed.
 *
 * The difference with {@link uploadFile} is that
 * the returned object will act like a message media
 * and contain fields like File ID.
 *
 * @param media  Media to upload
 * @param params  Upload parameters
 * @internal
 */
export async function uploadMedia(
    this: TelegramClient,
    media: InputMediaLike,
    params: {
        /**
         * Peer to associate this media with.
         * Defaults to `self`
         */
        peer?: InputPeerLike

        /**
         * Upload progress callback
         *
         * @param uploaded  Number of bytes uploaded
         * @param total  Total file size
         */
        progressCallback?: (uploaded: number, total: number) => void
    } = {},
): Promise<Extract<MessageMedia, Photo | RawDocument>> {
    const normMedia = await this._normalizeInputMedia(media, params, false)

    switch (normMedia._) {
        case 'inputMediaEmpty':
        case 'inputMediaGeoPoint':
        case 'inputMediaGeoLive':
        case 'inputMediaContact':
        case 'inputMediaVenue':
        case 'inputMediaGame':
        case 'inputMediaInvoice':
        case 'inputMediaPoll':
        case 'inputMediaDice':
            throw new MtArgumentError("This media can't be uploaded")
    }

    const res = await this.call({
        _: 'messages.uploadMedia',
        peer: params.peer ?
            await this.resolvePeer(params.peer) :
            {
                _: 'inputPeerSelf',
            },
        media: normMedia,
    })

    assertTypeIsNot('uploadMedia', res, 'messageMediaEmpty')

    switch (normMedia._) {
        case 'inputMediaUploadedPhoto':
        case 'inputMediaPhoto':
        case 'inputMediaPhotoExternal':
            assertTypeIs('uploadMedia', res, 'messageMediaPhoto')
            assertTypeIs('uploadMedia', res.photo!, 'photo')

            return new Photo(this, res.photo, res)
        case 'inputMediaUploadedDocument':
        case 'inputMediaDocument':
        case 'inputMediaDocumentExternal':
            assertTypeIs('uploadMedia', res, 'messageMediaDocument')
            assertTypeIs('uploadMedia', res.document!, 'document')

            // eslint-disable-next-line
            return parseDocument(this, res.document, res) as any
        case 'inputMediaStory':
            throw new MtArgumentError("This media (story) can't be uploaded")
        default:
            assertNever(normMedia)
        //          ^?
    }
}
