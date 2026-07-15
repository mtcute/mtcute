import type { ITelegramClient } from '../../client.types.js'

import { Chat } from '../../types/index.js'

/**
 * Get a list of communities the current user has joined
 */
export async function getJoinedCommunities(client: ITelegramClient): Promise<Chat[]> {
  const res = await client.call({
    _: 'communities.getJoinedCommunities',
  })

  const ret: Chat[] = []
  for (const chat of res.chats) {
    if (chat._ === 'community' || chat._ === 'communityForbidden') {
      ret.push(new Chat(chat))
    }
  }

  return ret
}
