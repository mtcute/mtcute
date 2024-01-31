import { tdFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { MtArgumentError } from '../../../types/errors.js'
import { ITelegramClient } from '../../client.types.js'
import { InputFileLike, InputPeerLike, isUploadedFile, MtInvalidPeerTypeError } from '../../types/index.js'
import { fileIdToInputPhoto } from '../../utils/convert-file-id.js'
import { isInputPeerChannel, isInputPeerChat, toInputChannel } from '../../utils/peer-utils.js'
import { uploadFile } from '../files/upload-file.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Set a new chat photo or video.
 *
 * You must be an administrator and have the appropriate permissions.
 */
export async function setChatPhoto(
    client: ITelegramClient,
    params: {
        /** Chat ID or username */
        chatId: InputPeerLike

        /** Media type (photo or video) */

        type: 'photo' | 'video'

        /** Input media file */
        media: InputFileLike
        /**
         * When `type = video`, timestamp in seconds which will be shown
         * as a static preview.
         */
        previewSec?: number
    },
): Promise<void> {
    const { chatId, type, media, previewSec } = params

    const chat = await resolvePeer(client, chatId)

    if (!(isInputPeerChannel(chat) || isInputPeerChat(chat))) {
        throw new MtInvalidPeerTypeError(chatId, 'chat or channel')
    }

    let photo: tl.TypeInputChatPhoto | undefined = undefined

    let inputFile: tl.TypeInputFile

    if (tdFileId.isFileIdLike(media)) {
        if (typeof media === 'string' && media.match(/^https?:\/\//)) {
            throw new MtArgumentError("Chat photo can't be external")
        }
        if (typeof media === 'string' && media.match(/^file:/)) {
            const uploaded = await uploadFile(client, {
                file: media.substring(5),
            })
            inputFile = uploaded.inputFile
        } else {
            const input = fileIdToInputPhoto(media)
            photo = {
                _: 'inputChatPhoto',
                id: input,
            }
        }
    } else if (typeof media === 'object' && tl.isAnyInputMedia(media)) {
        if (media._ === 'inputMediaPhoto') {
            photo = {
                _: 'inputChatPhoto',
                id: media.id,
            }
        } else throw new MtArgumentError("Chat photo can't be InputMedia")
    } else if (isUploadedFile(media)) {
        inputFile = media.inputFile
    } else if (typeof media === 'object' && tl.isAnyInputFile(media)) {
        inputFile = media
    } else {
        const uploaded = await uploadFile(client, {
            file: media,
        })
        inputFile = uploaded.inputFile
    }

    if (!photo) {
        photo = {
            _: 'inputChatUploadedPhoto',
            [type === 'photo' ? 'file' : 'video']: inputFile!,
            videoStartTs: previewSec,
        }
    }

    let res

    if (isInputPeerChat(chat)) {
        res = await client.call({
            _: 'messages.editChatPhoto',
            chatId: chat.chatId,
            photo,
        })
    } else {
        res = await client.call({
            _: 'channels.editPhoto',
            channel: toInputChannel(chat),
            photo,
        })
    }
    client.handleClientUpdate(res)
}
