import type { ITelegramClient } from '../../client.types.js'
import type { InputDocumentId, InputMediaAudio } from '../../types/index.js'
import { assert } from '@fuman/utils'
import { tdFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'
import { assertTrue } from '../../../utils/type-assertions.js'
import { fileIdToInputDocument } from '../../utils/convert-file-id.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'

export async function saveMusicToProfile(
    client: ITelegramClient,
    params: {
        /** Audio file to save (or its ID) */
        audio: InputMediaAudio | InputDocumentId
        /** Optionally, document ID after which we should insert the music */
        after?: InputDocumentId

        /**
         * Upload progress callback
         *
         * @param uploaded  Number of bytes uploaded
         * @param total  Total file size
         */
        progressCallback?: (uploaded: number, total: number) => void
    },
): Promise<void> {
    let after = params.after
    if (tdFileId.isFileIdLike(after)) {
        after = fileIdToInputDocument(after)
    }

    let audio: InputMediaAudio | InputDocumentId = params.audio
    if (tdFileId.isFileIdLike(audio)) {
        audio = {
            type: 'audio',
            file: audio,
        }
    }

    let audioId: tl.TypeInputDocument
    if (tl.isAnyInputDocument(audio)) {
        audioId = audio
    } else {
        const media = await _normalizeInputMedia(client, audio, {
            progressCallback: params.progressCallback,
            uploadPeer: { _: 'inputPeerSelf' },
        }, true)
        assert(media._ === 'inputMediaDocument')
        audioId = media.id
    }

    const res = await client.call({
        _: 'account.saveMusic',
        id: audioId,
        afterId: after,
    })

    assertTrue('account.saveMusic', res)
}

export async function unsaveMusicFromProfile(
    client: ITelegramClient,
    params: {
        /** ID of the Audio file to unsave */
        audio: InputDocumentId
    },
): Promise<void> {
    let audio = params.audio
    if (tdFileId.isFileIdLike(audio)) {
        audio = fileIdToInputDocument(audio)
    }

    const res = await client.call({
        _: 'account.saveMusic',
        id: audio,
        unsave: true,
    })

    assertTrue('account.saveMusic', res)
}
