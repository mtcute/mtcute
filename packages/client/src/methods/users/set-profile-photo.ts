import { fileIdToInputPhoto, tdFileId } from '@mtcute/file-id'
import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { InputFileLike, MtArgumentError, Photo } from '../../types'

/**
 * Set a new profile photo or video.
 *
 * You can also pass a file ID or an InputPhoto to re-use existing photo.
 *
 * @param type  Media type (photo or video)
 * @param media  Input media file
 * @param previewSec
 *   When `type = video`, timestamp in seconds which will be shown
 *   as a static preview.
 * @internal
 */
export async function setProfilePhoto(
    this: TelegramClient,
    type: 'photo' | 'video',
    media: InputFileLike | tl.TypeInputPhoto,
    previewSec?: number,
): Promise<Photo> {
    // try parsing media as file id or input photo
    if (
        tdFileId.isFileIdLike(media) ||
        (typeof media === 'object' && tl.isAnyInputPhoto(media))
    ) {
        if (typeof media === 'string' && media.match(/^https?:\/\//)) {
            throw new MtArgumentError("Profile photo can't be set from URL.")
        }

        if (typeof media !== 'string' || !media.match(/^file:/)) {
            if (tdFileId.isFileIdLike(media)) {
                media = fileIdToInputPhoto(media)
            }

            const res = await this.call({
                _: 'photos.updateProfilePhoto',
                id: media,
            })

            return new Photo(this, res.photo as tl.RawPhoto)
        }
    }

    const res = await this.call({
        _: 'photos.uploadProfilePhoto',
        [type === 'photo' ? 'file' : 'video']: await this._normalizeInputFile(
            media,
            {},
        ),
        videoStartTs: previewSec,
    })

    return new Photo(this, res.photo as tl.RawPhoto)
}
