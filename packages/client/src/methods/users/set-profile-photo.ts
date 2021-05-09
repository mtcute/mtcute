import { TelegramClient } from '../../client'
import { InputFileLike, Photo } from '../../types'
import { tl } from '@mtcute/tl'

/**
 * Set a new profile photo or video.
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
    media: InputFileLike,
    previewSec?: number
): Promise<Photo> {
    const res = await this.call({
        _: 'photos.uploadProfilePhoto',
        [type === 'photo' ? 'file' : 'video']: await this._normalizeInputFile(media, {}),
        videoStartTs: previewSec
    })

    return new Photo(this, res.photo as tl.RawPhoto)
}
