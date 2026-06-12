import type Long from 'long'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import type { InputRichMessage, RichMediaUploadCache } from '../../types/messages/rich/types.js'
import { randomLong } from '../../../utils/long-utils.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { resolvePeer } from '../users/resolve-peer.js'
import { _normalizeInputRichMessage } from './normalize-rich-message.js'

// @exported
export interface RichStreamingDraft {
  /** Random ID of the draft */
  readonly randomId: Long
  /** Replace the draft with the given rich message */
  send(content: InputRichMessage): Promise<void>
  /**
   * Cache of media uploaded while streaming the draft (unless disabled).
   *
   * Pass it to the final {@link sendRichMessage} call to avoid re-uploading the media.
   */
  readonly uploadCache?: RichMediaUploadCache
}

/**
 * Create a streaming rich message draft
 *
 * @param chatId  Chat ID
 * @param params
 */
export async function createRichStreamingDraft(
  client: ITelegramClient,
  chatId: InputPeerLike,
  params?: {
    /**
     * Unique identifier of the business connection on behalf of which the action will be sent
     */
    businessConnectionId?: string

    /** Whether to disable upload cache (exists to prevent uploading the same media multiple times) */
    disableUploadCache?: boolean

    /**
     * For comment threads, ID of the thread (i.e. top message)
     */
    threadId?: number

    /**
     * Function that will be called after some part of the media has been uploaded.
     *
     * @param id  ID of the file being uploaded
     * @param uploaded  Number of bytes already uploaded
     * @param total  Total file size
     */
    progressCallback?: (id: string, uploaded: number, total: number) => void
  },
): Promise<RichStreamingDraft> {
  const { threadId, businessConnectionId, progressCallback } = params ?? {}
  const randomId = randomLong()
  const peer = await resolvePeer(client, chatId)

  // cache uploaded media to avoid re-uploading it on every send
  const uploadCache: RichMediaUploadCache | undefined = params?.disableUploadCache ? undefined : new Map()

  const sendDraft = async (content: InputRichMessage) => {
    const richMessage = await _normalizeInputRichMessage(client, peer, content, { progressCallback, uploadCache })

    const r = await client.call({
      _: 'messages.setTyping',
      peer,
      action: {
        _: 'inputSendMessageRichMessageDraftAction',
        randomId,
        richMessage,
      },
      topMsgId: threadId,
    }, {
      businessConnectionId,
    })

    assertTrue('messages.setTyping', r)
  }

  return {
    randomId,
    send: sendDraft,
    uploadCache,
  }
}
