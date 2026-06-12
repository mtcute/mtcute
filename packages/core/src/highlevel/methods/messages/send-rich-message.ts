import type Long from 'long'

import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'
import type { ReplyMarkup } from '../../types/bots/keyboards/index.js'
import type { InputMediaLike } from '../../types/media/input-media/types.js'
import type { Message } from '../../types/messages/message.js'
import type {
  InputPageBlock,
  InputPageBlockWithFile,
  InputRichMessage,
  InputRichMessageMedia,
} from '../../types/messages/rich/types.js'
import type { InputPeerLike } from '../../types/peers/index.js'
import type { CommonSendParams } from './send-common.js'
import { parallelMap } from '@fuman/utils'
import { MtArgumentError, MtTypeAssertionError } from '../../../types/errors.js'
import { randomLong } from '../../../utils/long-utils.js'
import { assertTypeIs } from '../../../utils/type-assertions.js'
import { BotKeyboard } from '../../types/bots/keyboards/index.js'
import { _normalizeInputMedia } from '../files/normalize-input-media.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _findMessageInUpdate } from './find-in-update.js'
import { _processCommonSendParameters } from './send-common.js'

async function _uploadRichMedia(
  client: ITelegramClient,
  peer: tl.TypeInputPeer,
  id: string,
  media: InputRichMessageMedia,
  params: {
    abortSignal?: AbortSignal
    progressCallback?: (id: string, uploaded: number, total: number) => void
  },
): Promise<tl.RawInputMediaPhoto | tl.RawInputMediaDocument> {
  const input: InputMediaLike = typeof media === 'string' ? { type: 'auto', file: media } : media

  const normalized = await _normalizeInputMedia(client, input, {
    uploadPeer: peer,
    abortSignal: params.abortSignal,
    progressCallback: params.progressCallback?.bind(null, id),
  }, true)

  if (normalized._ !== 'inputMediaPhoto' && normalized._ !== 'inputMediaDocument') {
    throw new MtTypeAssertionError('sendRichMessage (upload)', 'inputMediaDocument | inputMediaPhoto', normalized._)
  }

  return normalized
}

async function _normalizeInputRichMessage(
  client: ITelegramClient,
  peer: tl.TypeInputPeer,
  input: InputRichMessage,
  params: CommonSendParams & {
    progressCallback?: (id: string, uploaded: number, total: number) => void
  },
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
      const block = processBlock(node.block) as tl.TypePageBlock
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
  }
}

/**
 * Send a rich message
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param params  Rich message contents and additional sending parameters
 */
export async function sendRichMessage(
  client: ITelegramClient,
  chatId: InputPeerLike,
  params: CommonSendParams & {
    content: InputRichMessage

    /** Override the default random ID, for streaming drafts */
    randomId?: Long

    /**
     * For bots: inline or reply markup or an instruction
     * to hide a reply keyboard or to force a reply.
     */
    replyMarkup?: ReplyMarkup

    /**
     * Function that will be called after some part has been uploaded.
     *
     * @param id  ID of the file being uploaded
     * @param uploaded  Number of bytes already uploaded
     * @param total  Total file size
     */
    progressCallback?: (id: string, uploaded: number, total: number) => void
  },
): Promise<Message> {
  const { peer, replyTo, scheduleDate, chainId, quickReplyShortcut } = await _processCommonSendParameters(
    client,
    chatId,
    params,
  )

  const richMessage = await _normalizeInputRichMessage(client, peer, params.content, params)
  const randomId = params.randomId ?? randomLong()
  const res = await client.call(
    {
      _: 'messages.sendMessage',
      peer,
      silent: params.silent,
      replyTo,
      randomId,
      scheduleDate,
      replyMarkup: BotKeyboard._convertToTl(params.replyMarkup),
      message: '',
      clearDraft: params.clearDraft,
      noforwards: params.forbidForwards,
      sendAs: params.sendAs ? await resolvePeer(client, params.sendAs) : undefined,
      quickReplyShortcut,
      effect: params.effect,
      allowPaidFloodskip: params.allowPaidFloodskip,
      allowPaidStars: params.allowPaidMessages,
      richMessage,
    },
    {
      chainId,
      abortSignal: params.abortSignal,
      businessConnectionId: params.businessConnectionId,
    },
  )

  return _findMessageInUpdate(client, res, false, !params.shouldDispatch, false, randomId)
}
