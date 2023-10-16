import { BaseTelegramClient, MtArgumentError, tl } from '@mtcute/core'
import { fileIdToInputPhoto, tdFileId } from '@mtcute/file-id'

import { InputFileLike, Photo } from '../../types/index.js'
import { _normalizeInputFile } from '../files/normalize-input-file.js'

/**
 * Set a new profile photo or video.
 *
 * You can also pass a file ID or an InputPhoto to re-use existing photo.
 */
export async function setProfilePhoto(
    client: BaseTelegramClient,
    params: {
        /** Media type (photo or video) */
        type: 'photo' | 'video'
        /** Input media file */
        media: InputFileLike | tl.TypeInputPhoto
        /** When `type = video`, timestamp in seconds which will be shown as a static preview. */
        previewSec?: number
    },
): Promise<Photo> {
    const { type, previewSec } = params
    let { media } = params

    // try parsing media as file id or input photo
    if (tdFileId.isFileIdLike(media) || (typeof media === 'object' && tl.isAnyInputPhoto(media))) {
        if (typeof media === 'string' && media.match(/^https?:\/\//)) {
            throw new MtArgumentError("Profile photo can't be set from URL.")
        }

        if (typeof media !== 'string' || !media.match(/^file:/)) {
            if (tdFileId.isFileIdLike(media)) {
                media = fileIdToInputPhoto(media)
            }

            const res = await client.call({
                _: 'photos.updateProfilePhoto',
                id: media,
            })

            return new Photo(res.photo as tl.RawPhoto)
        }
    }

    const res = await client.call({
        _: 'photos.uploadProfilePhoto',
        [type === 'photo' ? 'file' : 'video']: await _normalizeInputFile(client, media, {}),
        videoStartTs: previewSec,
    })

    return new Photo(res.photo as tl.RawPhoto)
}
