import type { tl } from '../../../tl/index.js'

import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'
import type { InputSuggestedPost } from '../messages/_normalize-suggested-post.js'
import { _normalizeInputSuggestedPost } from '../messages/_normalize-suggested-post.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @exported
export type DraftMessageInput = Omit<tl.RawDraftMessage, '_' | 'date' | 'richMessage' | 'suggestedPost'> & {
  richMessage?: tl.TypeInputRichMessage

  /** Information about the post suggested to a channel via its direct messages chat */
  suggestedPost?: InputSuggestedPost
}

/**
 * Save or delete a draft message associated with some chat
 *
 * @param chatId  ID of the chat, its username, phone or `"me"` or `"self"`
 * @param draft  Draft message, or `null` to delete.
 */
export async function saveDraft(
  client: ITelegramClient,
  chatId: InputPeerLike,
  draft: null | DraftMessageInput,
): Promise<void> {
  const peer = await resolvePeer(client, chatId)

  if (draft) {
    await client.call({
      _: 'messages.saveDraft',
      peer,
      ...draft,
      suggestedPost: _normalizeInputSuggestedPost(draft.suggestedPost),
    })
  } else {
    await client.call({
      _: 'messages.saveDraft',
      peer,
      message: '',
    })
  }
}
