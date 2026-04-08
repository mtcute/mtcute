import type Long from 'long'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, InputText, TextWithEntities } from '../../types/index.js'
import { randomLong } from '../../../utils/long-utils.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { joinTextWithEntities } from '../../utils/entities.js'
import { _normalizeInputText } from '../misc/normalize-text.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @exported
export interface StreamingDraft {
  /** Random ID of the draft */
  readonly randomId: Long
  /** Depending on the `mode`, this method will either append or replace the draft */
  send(text: InputText): Promise<void>
  /** Final text of the draft, for convenience */
  get finalText(): TextWithEntities
}

/**
 * Create a streaming text message draft
 *
 * @param chatId  Chat ID
 * @param params
 */
export async function createStreamingDraft(
  client: ITelegramClient,
  chatId: InputPeerLike,
  params?: {
    /**
     * Unique identifier of the business connection on behalf of which the action will be sent
     */
    businessConnectionId?: string

    /**
     * For comment threads, ID of the thread (i.e. top message)
     */
    threadId?: number

    /**
     * Mode of the draft's `send` method
     *
     * - `append` - appends the text to the previous draft
     * - `replace` - replaces the previous draft with the new one
     *
     * @default  `replace`
     */
    mode?: 'append' | 'replace'
  },
): Promise<StreamingDraft> {
  const {
    mode = 'replace',
    threadId,
    businessConnectionId,
  } = params ?? {}
  const randomId = randomLong()
  const peer = await resolvePeer(client, chatId)

  let previousText: TextWithEntities | undefined

  const sendDraft = async (text: InputText) => {
    if (typeof text === 'string') {
      text = { text }
    }

    if (mode === 'append' && previousText) {
      text = joinTextWithEntities([previousText, text])
    }

    previousText = text

    const [_text, entities = []] = await _normalizeInputText(client, text)

    const r = await client.call({
      _: 'messages.setTyping',
      peer,
      action: {
        _: 'sendMessageTextDraftAction',
        text: {
          _: 'textWithEntities',
          text: _text,
          entities,
        },
        randomId,
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
    get finalText(): TextWithEntities {
      return previousText ?? { text: '', entities: [] }
    },
  }
}
