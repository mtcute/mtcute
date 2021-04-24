import { TelegramClient } from '../../client'
import {
    InputFileLike,
    InputPeerLike,
    isUploadedFile,
    MtCuteArgumentError,
    MtCuteInvalidPeerTypeError,
} from '../../types'
import { normalizeToInputChannel, normalizeToInputPeer } from '../../utils/peer-utils'
import { tl } from '@mtcute/tl'

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
    const chat = normalizeToInputPeer(await this.resolvePeer(chatId))
    if (!(chat._ === 'inputPeerChat' || chat._ === 'inputPeerChannel'))
        throw new MtCuteInvalidPeerTypeError(chatId, 'chat or channel')

    let input: tl.TypeInputFile

    if (typeof media === 'string' && media.match(/^https?:\/\//)) {
        throw new MtCuteArgumentError("Chat photo can't be external")
    } else if (typeof media === 'object' && tl.isAnyInputMedia(media)) {
        throw new MtCuteArgumentError("Chat photo can't be InputMedia")
    } else if (isUploadedFile(media)) {
        input = media.inputFile
    } else if (typeof media === 'object' && tl.isAnyInputFile(media)) {
        input = media
    } else {
        const uploaded = await this.uploadFile({
            file: media,
        })
        input = uploaded.inputFile
    }

    const photo: tl.RawInputChatUploadedPhoto = {
        _: 'inputChatUploadedPhoto',
        [type === 'photo' ? 'file' : 'video']: input,
        videoStartTs: previewSec
    }

    let res
    if (chat._ === 'inputPeerChat') {
        res = await this.call({
            _: 'messages.editChatPhoto',
            chatId: chat.chatId,
            photo
        })
    } else {
        res = await this.call({
            _: 'channels.editPhoto',
            channel: normalizeToInputChannel(chat)!,
            photo
        })
    }
    this._handleUpdate(res)
}
