import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { InputMediaLike } from '../../types/media/input-media/types.js'
import type {
  InputPageBlock,
  InputPageBlockWithFile,
  InputRichMessage,
  InputRichMessageMedia,
  RichMediaUploadCache,
} from '../../types/messages/rich/types.js'
import { parallelMap } from '@fuman/utils'
import { MtArgumentError, MtTypeAssertionError } from '../../../types/errors.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { toInputUser } from '../../utils/peer-utils.js'
import { walkPageBlocks } from '../../utils/walk-page-blocks.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { resolvePeerMany } from '../users/resolve-peer-many.js'

interface NormalizeRichMessageParams {
  abortSignal?: AbortSignal
  progressCallback?: (id: string, uploaded: number, total: number) => void
  uploadCache?: RichMediaUploadCache
}

/**
 * Derive a stable cache key for the given media, or `undefined` if it shouldn't be cached.
 *
 * Strings (file ids/urls/paths) and {@link InputMedia} wrapping a string file are keyed by
 * value (so they survive draft re-renders); other {@link InputMedia} (streams, blobs, …) are
 * keyed by reference, which is also the only way a non-rewindable source survives into the
 * next draft. Raw input refs are already remote and never re-uploaded, so they aren't cached.
 */
function _richMediaCacheKey(media: InputRichMessageMedia): unknown {
  if (typeof media === 'string') return `auto:${media}`
  if ('_' in media) return undefined
  if (typeof media.file === 'string') return `${media.type}:${media.file}`
  return media
}

async function _uploadRichMedia(
  client: ITelegramClient,
  peer: tl.TypeInputPeer,
  id: string,
  media: InputRichMessageMedia,
  params: NormalizeRichMessageParams,
): Promise<tl.RawInputMediaPhoto | tl.RawInputMediaDocument> {
  const cacheKey = params.uploadCache != null ? _richMediaCacheKey(media) : undefined
  if (cacheKey !== undefined) {
    const cached = params.uploadCache!.get(cacheKey)
    if (cached != null) return cached
  }

  const input: InputMediaLike = typeof media === 'string' ? { type: 'auto', file: media } : media

  const normalized = await _normalizeInputMedia(client, input, {
    uploadPeer: peer,
    abortSignal: params.abortSignal,
    progressCallback: params.progressCallback?.bind(null, id),
  }, true)

  if (normalized._ !== 'inputMediaPhoto' && normalized._ !== 'inputMediaDocument') {
    throw new MtTypeAssertionError('sendRichMessage (upload)', 'inputMediaDocument | inputMediaPhoto', normalized._)
  }

  if (cacheKey !== undefined) params.uploadCache!.set(cacheKey, normalized)

  return normalized
}

// @skip
export async function _normalizeInputRichMessage(
  client: ITelegramClient,
  peer: tl.TypeInputPeer,
  input: InputRichMessage,
  params: NormalizeRichMessageParams,
): Promise<tl.TypeInputRichMessage> {
  if ('_' in input) return input

  if (input.type !== 'blocks') {
    let richFiles: tl.TypeInputRichFile[] | undefined
    if (input.attachments) {
      const medias = [...Object.entries(input.attachments)]
      const normalized = await parallelMap(
        medias,
        async ([id, media]) => [id, await _uploadRichMedia(client, peer, id, media, params)] as const,
        { limit: 4, signal: params.abortSignal },
      )

      richFiles = normalized.map(([id, media]) =>
        media._ === 'inputMediaDocument'
          ? { _: 'inputRichFileDocument', id, document: media.id }
          : { _: 'inputRichFilePhoto', id, photo: media.id },
      )
    }

    return input.type === 'markdown'
      ? {
          _: 'inputRichMessageMarkdown',
          rtl: input.rtl,
          noautolink: input.skipEntityDetection,
          files: richFiles,
          markdown: input.content,
        }
      : {
          _: 'inputRichMessageHTML',
          rtl: input.rtl,
          noautolink: input.skipEntityDetection,
          files: richFiles,
          html: input.content,
        }
  }

  const photos: tl.TypeInputPhoto[] = []
  const documents: tl.TypeInputDocument[] = []

  // first pass: walk the tree and collect "file blocks", while also normalizing them to regular pageBlock-s
  const fileBlocks: { block: tl.TypePageBlock, media: InputRichMessageMedia }[] = []

  function processBlock(node: InputPageBlock | InputPageBlockWithFile): tl.TypePageBlock {
    if ('file' in node) {
      const block = processBlock(node.block)
      fileBlocks.push({ block, media: node.file })
      return block
    }

    switch (node._) {
      case 'pageBlockCover':
        return { ...node, cover: processBlock(node.cover) } as tl.TypePageBlock
      case 'pageBlockCollage':
      case 'pageBlockSlideshow':
        return { ...node, items: node.items.map(processBlock) } as tl.TypePageBlock
      case 'pageBlockDetails':
      case 'pageBlockEmbedPost':
      case 'pageBlockBlockquoteBlocks':
        return { ...node, blocks: node.blocks.map(processBlock) } as tl.TypePageBlock
      case 'pageBlockList':
        return {
          ...node,
          items: node.items.map(item =>
            item._ === 'pageListItemBlocks'
              ? {
                  ...item,
                  blocks: item.blocks.map(processBlock),
                }
              : item,
          ),
        } as tl.TypePageBlock
      case 'pageBlockOrderedList':
        return {
          ...node,
          items: node.items.map(item =>
            item._ === 'pageListOrderedItemBlocks' ? { ...item, blocks: item.blocks.map(processBlock) } : item,
          ),
        } as tl.TypePageBlock
      default:
        return node as tl.TypePageBlock
    }
  }

  const blocks = input.blocks.map(processBlock)

  const mentionIds = new Set<number>()
  walkPageBlocks(blocks, {
    richText: (text) => {
      if (text._ === 'textMentionName') mentionIds.add(text.userId)
    },
  })
  const users = mentionIds.size
    ? await resolvePeerMany(client, [...mentionIds], toInputUser)
    : undefined

  // second pass: upload the media and patch the file blocks with the actual IDs
  const uploaded = await parallelMap(
    fileBlocks,
    async ({ block, media }, idx) => {
      const uploaded = await _uploadRichMedia(client, peer, `block-${idx}`, media, params)
      return { block, media: uploaded }
    },
    { limit: 4, signal: params.abortSignal },
  )

  for (const { block, media } of uploaded) {
    if (media._ === 'inputMediaPhoto') {
      const photo = media.id
      assertTypeIs('sendRichMessage (upload)', photo, 'inputPhoto')
      photos.push(photo)

      switch (block._) {
        case 'pageBlockPhoto': block.photoId = photo.id; break
        case 'pageBlockEmbed': block.posterPhotoId = photo.id; break
        case 'pageBlockEmbedPost': block.authorPhotoId = photo.id; break
        default:
          throw new MtArgumentError(`sendRichMessage: expected photo ${photo.id} to be used in a photo block, but got ${block._}`)
      }
    } else {
      const document = media.id
      assertTypeIs('sendRichMessage (upload)', document, 'inputDocument')
      documents.push(document)

      switch (block._) {
        case 'pageBlockVideo': block.videoId = document.id; break
        case 'pageBlockAudio': block.audioId = document.id; break
        default:
          throw new MtArgumentError(`sendRichMessage: expected document ${document.id} to be used in a document block, but got ${block._}`)
      }
    }
  }

  return {
    _: 'inputRichMessage',
    rtl: input.rtl,
    noautolink: input.skipEntityDetection,
    blocks,
    photos: photos.length ? photos : undefined,
    documents: documents.length ? documents : undefined,
    users: users?.length ? users : undefined,
  }
}
