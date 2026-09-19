import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { ArrayPaginated, Audio, InputDocumentId, InputPeerLike } from '../../types/index.js'
import { assert } from '@fuman/utils'
import Long from 'long'
import { assertTypeIsNot } from '../../../utils/type-assertions.js'
import { parseDocument } from '../../types/media/document-utils.js'
import { makeArrayPaginated } from '../../utils/index.js'
import { _normalizeInputDocumentId } from '../files/normalize-file-to-document.js'
import { resolveUser } from './resolve-peer.js'

function parseSavedMusic(documents: tl.TypeDocument[]): Audio[] {
  const files: Audio[] = []

  for (const file of documents) {
    if (file._ !== 'document') continue
    const doc = parseDocument(file)
    assert(doc.type === 'audio')
    files.push(doc)
  }

  return files
}

/**
 * Get music files saved to the user's profile
 */
export async function getSavedMusic(
  client: ITelegramClient,
  params: {
    /** User ID, username, phone number, `"me"` or `"self"` */
    userId: InputPeerLike

    /** Offset for pagination */
    offset?: number
    /** Limit for pagination */
    limit?: number
  },
): Promise<ArrayPaginated<Audio, number>> {
  const res = await client.call({
    _: 'users.getSavedMusic',
    id: await resolveUser(client, params.userId),
    offset: params.offset ?? 0,
    limit: params.limit ?? 100,
    hash: Long.ZERO,
  })

  assertTypeIsNot(res, 'users.savedMusicNotModified')

  const files = parseSavedMusic(res.documents)

  let nextOffset: number | undefined = (params.offset ?? 0) + files.length
  if (nextOffset >= res.count) nextOffset = undefined

  return makeArrayPaginated(
    files,
    res.count ?? files.length,
    nextOffset,
  )
}

/**
 * Get music files saved to the user's profile by their IDs.
 *
 * Can be used to check whether the given files are still saved to the profile,
 * or to refresh their file references. Files that are no longer saved are omitted.
 */
export async function getSavedMusicById(
  client: ITelegramClient,
  params: {
    /** User ID, username, phone number, `"me"` or `"self"` */
    userId: InputPeerLike
    /** IDs of the music files */
    ids: InputDocumentId[]
  },
): Promise<Audio[]> {
  const res = await client.call({
    _: 'users.getSavedMusicByID',
    id: await resolveUser(client, params.userId),
    documents: params.ids.map(_normalizeInputDocumentId),
  })

  assertTypeIsNot(res, 'users.savedMusicNotModified')

  return parseSavedMusic(res.documents)
}

/**
 * Get IDs of all music files saved to the current user's profile
 */
export async function getSavedMusicIds(client: ITelegramClient): Promise<tl.Long[]> {
  const res = await client.call({
    _: 'account.getSavedMusicIds',
    hash: Long.ZERO,
  })

  assertTypeIsNot(res, 'account.savedMusicIdsNotModified')

  return res.ids
}
