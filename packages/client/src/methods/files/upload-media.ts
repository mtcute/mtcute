import {
    InputMediaLike,
    InputPeerLike,
    MessageMedia,
    MtArgumentError,
    MtTypeAssertionError,
    Photo, RawDocument,
} from '../../types'
import { TelegramClient } from '../../client'
import { assertTypeIs } from '../../utils/type-assertion'
import { parseDocument } from '../../types/media/document-utils'
import { assertNever } from '@mtcute/core'

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
    } = {}
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
        peer: params.peer
            ? await this.resolvePeer(params.peer)
            : {
                  _: 'inputPeerSelf',
              },
        media: normMedia,
    })

    if (res._ === 'messageMediaEmpty') {
        throw new MtTypeAssertionError(
            'uploadMedia',
            'not messageMediaEmpty',
            'messageMediaEmpty'
        )
    }

    switch (normMedia._) {
        case 'inputMediaUploadedPhoto':
        case 'inputMediaPhoto':
        case 'inputMediaPhotoExternal':
            assertTypeIs('uploadMedia', res, 'messageMediaPhoto')
            assertTypeIs('u"uploadMedia"res.photo!, 'p"photo"
;            return new Photo(this, res.photo)
 ;       case 'i"inputMediaUploadedDocument"        case 'i"inputMediaDocument"        case 'i"inputMediaDocumentExternal"            assertTypeIs('u"uploadMedia"res, 'm"messageMediaDocument" ;           assertTypeIs('u"uploadMedia"res.document!, 'd"document"
;            return parseDocument(this, res.document) as any
 ;       default:
            assertNever(normMedia)
 ;   }
}
