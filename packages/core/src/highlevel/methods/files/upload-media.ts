import { MtArgumentError } from '../../../types/errors.js'
import { assertNever } from '../../../types/utils.js'
import { assertTypeIs, assertTypeIsNot } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputMediaLike, InputPeerLike, MessageMedia, Photo, RawDocument } from '../../types/index.js'
import { parseDocument } from '../../types/media/document-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _normalizeInputMedia } from './normalize-input-media.js'

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
 */
export async function uploadMedia(
    client: ITelegramClient,
    media: InputMediaLike,
    params: {
        /**
         * Peer to associate this media with.
         *
         * @default  `self`
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
    const normMedia = await _normalizeInputMedia(client, media, params, false)

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

    const res = await client.call({
        _: 'messages.uploadMedia',
        peer: params.peer ?
            await resolvePeer(client, params.peer) :
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

            return new Photo(res.photo)
        case 'inputMediaUploadedDocument':
        case 'inputMediaDocument':
        case 'inputMediaDocumentExternal':
            assertTypeIs('uploadMedia', res, 'messageMediaDocument')
            assertTypeIs('uploadMedia', res.document!, 'document')

            // eslint-disable-next-line
            return parseDocument(res.document, res) as any
        case 'inputMediaStory':
        case 'inputMediaWebPage':
            throw new MtArgumentError(`This media (${normMedia._}) can't be uploaded`)
        default:
            assertNever(normMedia)
    }
}
