import { TelegramClient } from '../../client'
import {
    InputFileLike,
    InputPeerLike,
    isUploadedFile,
    MtqtArgumentError,
    MtqtInvalidPeerTypeError,
} from '../../types'
import {
    isInputPeerChannel,
    isInputPeerChat,
    normalizeToInputChannel,
} from '../../utils/peer-utils'
import { tl } from '@mtqt/tl'
import { fileIdToInputPhoto, tdFileId } from '@mtqt/file-id'

/**
 * Set a new chat photo or video.
 *
 * You must be an administrator and have the appropriate permissions.
 *
 * @param chatId  Chat ID or username
 * @param type  Media type (photo or video)
 * @param media  Input media file
 * @param previewSec
 *   When `type = video`, timestamp in seconds which will be shown
 *   as a static preview.
 * @internal
 */
export async function setChatPhoto(
    this: TelegramClient,
    chatId: InputPeerLike,
    type: 'photo' | 'video',
    media: InputFileLike,
    previewSec?: number
): Promise<void> {
    const chat = await this.resolvePeer(chatId)
    if (!(isInputPeerChannel(chat) || isInputPeerChat(chat)))
        throw new MtqtInvalidPeerTypeError(chatId, 'chat or channel')

    let photo: tl.TypeInputChatPhoto | undefined = undefined

    let inputFile: tl.TypeInputFile
    if (tdFileId.isFileIdLike(media)) {
        if (typeof media === 'string' && media.match(/^https?:\/\//))
            throw new MtqtArgumentError("Chat photo can't be external")
        if (typeof media === 'string' && media.match(/^file:/)) {
            const uploaded = await this.uploadFile({
                file: media.substr(5),
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
        } else throw new MtqtArgumentError("Chat photo can't be InputMedia")
    } else if (isUploadedFile(media)) {
        inputFile = media.inputFile
    } else if (typeof media === 'object' && tl.isAnyInputFile(media)) {
        inputFile = media
    } else {
        const uploaded = await this.uploadFile({
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
        res = await this.call({
            _: 'messages.editChatPhoto',
            chatId: chat.chatId,
            photo,
        })
    } else {
        res = await this.call({
            _: 'channels.editPhoto',
            channel: normalizeToInputChannel(chat),
            photo,
        })
    }
    this._handleUpdate(res)
}
