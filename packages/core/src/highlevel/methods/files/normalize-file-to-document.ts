import type { ITelegramClient } from '../../client.types.js'

import type {
  InputDocumentId,
  InputFileLike,
  InputMediaAudio,
  InputMediaDocument,
  InputMediaSticker,
  InputMediaVideo,
  InputMediaVoice,
} from '../../types/index.js'
import { tdFileId } from '@mtcute/file-id'
import { tl } from '../../../tl/index.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'

import { fileIdToInputDocument } from '../../utils/convert-file-id.js'
import { _normalizeInputMedia } from './normalize-input-media.js'

/**
 * @internal
 * @noemit
 */
export function _normalizeInputDocumentId(id: InputDocumentId): tl.RawInputDocument {
  if (tdFileId.isFileIdLike(id)) {
    return fileIdToInputDocument(id)
  }

  return id
}

/**
 * @internal
 */
export async function _normalizeFileToDocument(
  client: ITelegramClient,
  file:
    | InputFileLike
    | tl.TypeInputDocument
    | InputMediaAudio
    | InputMediaVoice
    | InputMediaDocument
    | InputMediaSticker
    | InputMediaVideo,
  params: {
    progressCallback?: (uploaded: number, total: number) => void
    uploadPeer?: tl.TypeInputPeer
  },
): Promise<tl.TypeInputDocument> {
  if (typeof file === 'object' && tl.isAnyInputDocument(file)) {
    return file
  }

  const isMedia = typeof file === 'object' && 'type' in file && 'file' in file

  const media = await _normalizeInputMedia(
    client,
    isMedia ? file : { type: 'document', file },
    params,
    true,
  )

  assertTypeIs(media, 'inputMediaDocument')
  assertTypeIs(media.id, 'inputDocument')

  return media.id
}
