import type { Emitter } from '@fuman/utils'
import type Long from 'long'
import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, InputText, TextWithEntities } from '../../types/index.js'
import type { RawUpdateInfo } from '../../updates/types.js'
import { LongMap, randomLong } from '../../../utils/long-utils.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { joinTextWithEntities } from '../../utils/entities.js'
import { _normalizeInputText } from '../misc/normalize-text.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @exported
export interface StreamingDraft {
  /** Random ID of the draft */
  readonly randomId: Long
  /**
   * Depending on the `mode`, this method will either append or replace the draft.
   * Does nothing once the draft was stopped by the user
   */
  send(text: InputText): Promise<void>
  /** Final text of the draft, for convenience */
  get finalText(): TextWithEntities
  /**
   * Signal that is aborted once the user stops the draft generation.
   * Only present if `canStop` was passed, requires updates to be enabled
   */
  readonly signal?: AbortSignal
  /** Stop listening for the user stopping the draft. Call once the draft is no longer needed */
  dispose(): void
  [Symbol.dispose](): void
}

const draftStopListeners = new WeakMap<Emitter<RawUpdateInfo>, {
  controllers: LongMap<AbortController>
  onUpdate: (info: RawUpdateInfo) => void
}>()

/** @internal */
export function _listenForDraftStop(
  client: ITelegramClient,
  randomId: Long,
): { signal: AbortSignal, dispose: () => void } {
  const emitter = client.onRawUpdate

  const removeController = (randomId: Long) => {
    const listener = draftStopListeners.get(emitter)
    if (!listener?.controllers.delete(randomId) || listener.controllers.size > 0) return

    emitter.remove(listener.onUpdate)
    draftStopListeners.delete(emitter)
  }

  let listener = draftStopListeners.get(emitter)
  if (!listener) {
    const controllers = new LongMap<AbortController>()
    listener = {
      controllers,
      onUpdate: ({ update }) => {
        if (update._ !== 'updateUserTyping' || update.action._ !== 'sendMessageStopDraftAction') return

        const controller = controllers.get(update.action.randomId)
        if (!controller) return

        removeController(update.action.randomId)
        controller.abort()
      },
    }
    draftStopListeners.set(emitter, listener)
    emitter.add(listener.onUpdate)
  }

  const controller = new AbortController()
  listener.controllers.set(randomId, controller)

  return {
    signal: controller.signal,
    dispose: () => removeController(randomId),
  }
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

    /** Whether the user should be able to stop the draft generation (see {@link StreamingDraft.signal}) */
    canStop?: boolean

    /** Whether the draft should be kept once the user stops the generation */
    keepOnStop?: boolean
  },
): Promise<StreamingDraft> {
  const {
    mode = 'replace',
    threadId,
    businessConnectionId,
    canStop,
    keepOnStop,
  } = params ?? {}
  const randomId = randomLong()
  const peer = await resolvePeer(client, chatId)
  const stopListener = canStop ? _listenForDraftStop(client, randomId) : undefined

  let previousText: TextWithEntities | undefined

  const sendDraft = async (text: InputText) => {
    if (stopListener?.signal.aborted) return

    if (typeof text === 'string') {
      text = { text }
    }

    if (mode === 'append' && previousText) {
      text = joinTextWithEntities([previousText, text])
    }

    previousText = text

    const [_text, entities = []] = await _normalizeInputText(client, text)
    if (stopListener?.signal.aborted) return

    const r = await client.call({
      _: 'messages.setTyping',
      peer,
      action: {
        _: 'sendMessageTextDraftAction',
        canStop,
        keepOnStop,
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
    signal: stopListener?.signal,
    dispose: () => stopListener?.dispose(),
    [Symbol.dispose]: () => stopListener?.dispose(),
  }
}
