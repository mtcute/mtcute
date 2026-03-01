import { base64 } from '@fuman/utils'

import { TlBinaryReader } from '@mtcute/tl-runtime'
import { tdFileId as td } from './types.js'
import { telegramRleDecode } from './utils.js'

function parsePhotoUniqueId(reader: TlBinaryReader, binary: Uint8Array): td.UniquePhotoLocation {
  const remaining = binary.length - reader.pos

  if (remaining === 13) {
    // stickerSetThumbnailVersion: byte(2) + long(8) + int(4)
    if (binary[reader.pos] === 2) {
      reader.pos += 1

      return {
        _: 'photoStickerSetVersion',
        stickerSetId: reader.long(),
        stickerSetVersion: reader.int(),
      }
    }
  }

  if (remaining === 9) {
    // dialogPhoto or thumbnail: long(8) + byte(1)
    return {
      _: 'photoId',
      id: reader.long(),
      subType: binary[reader.pos],
    }
  }

  if (remaining === 12) {
    const marker = reader.int()

    if (marker === 100) {
      return { _: 'photoLegacy', secret: reader.long() }
    }

    // fullLegacy/dialogPhotoLegacy/stickerSetThumbnailLegacy: long(volumeId) + int(localId)
    reader.pos -= 4

    return {
      _: 'photoVolumeId',
      volumeId: reader.long(),
      localId: reader.int(),
    }
  }

  if (remaining === 20) {
    const marker = reader.int()

    if (marker === 150) {
      return {
        _: 'photoStickerSet',
        stickerSetId: reader.long(),
        stickerSetAccessHash: reader.long(),
      }
    }

    throw new td.InvalidFileIdError(`Unexpected photo unique file ID marker: ${marker}`)
  }

  throw new td.InvalidFileIdError(
    `Unexpected photo unique file ID size: ${remaining} (${base64.encode(binary)})`,
  )
}

/**
 * Parse TDLib and Bot API compatible Unique File ID
 *
 * @param fileId  Unique File ID as a base-64 encoded string or Uint8Array
 */
export function parseUniqueFileId(fileId: string | Uint8Array): td.ParsedUniqueFileId {
  if (typeof fileId === 'string') fileId = base64.decode(fileId, true)

  const binary = telegramRleDecode(fileId)
  const reader = TlBinaryReader.manual(binary)
  const type = reader.int()

  if (type < 0 || type > 5) {
    throw new td.UnsupportedError(`Unsupported unique file ID type: ${type} (${base64.encode(fileId)})`)
  }

  switch (type) {
    case td.UniqueFileIdType.Web:
      return { type, url: reader.string() }
    case td.UniqueFileIdType.Photo:
      return { type, location: parsePhotoUniqueId(reader, binary) }
    case td.UniqueFileIdType.Document:
      return { type, id: reader.long() }
    case td.UniqueFileIdType.Secure:
      return { type, id: reader.long() }
    case td.UniqueFileIdType.Encrypted:
      return { type, id: reader.long() }
    case td.UniqueFileIdType.Temp:
      return { type, id: reader.long() }
    default:
      throw new td.UnsupportedError(`Unsupported unique file ID type: ${type}`)
  }
}
