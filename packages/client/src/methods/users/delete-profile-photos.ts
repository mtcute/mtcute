import { BaseTelegramClient, MaybeArray, tl } from '@mtcute/core'
import { fileIdToInputPhoto } from '@mtcute/file-id'

/**
 * Delete your own profile photos
 *
 * @param ids  ID(s) of the photos. Can be file IDs or raw TL objects
 */
export async function deleteProfilePhotos(
    client: BaseTelegramClient,
    ids: MaybeArray<string | tl.TypeInputPhoto>,
): Promise<void> {
    if (!Array.isArray(ids)) ids = [ids]

    const photos = ids.map((id) => {
        if (typeof id === 'string') {
            return fileIdToInputPhoto(id)
        }

        return id
    })

    await client.call({
        _: 'photos.deletePhotos',
        id: photos,
    })
}
