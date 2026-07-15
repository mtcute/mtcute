import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/index.js'

import { MtTypeAssertionError } from '../../../types/errors.js'
import { Chat } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Create a new community
 *
 * @returns  Newly created community
 */
export async function createCommunity(
  client: ITelegramClient,
  params: {
    /** Community title */
    title: string

    /** Chat to link to the community */
    chatId: InputPeerLike

    /** Community description */
    about?: string

    /** Whether the community should be hidden */
    hidden?: boolean

    /**
     * Whether to dispatch the returned updates
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<Chat> {
  const { title, chatId, about, hidden, shouldDispatch } = params

  const res = await client.call({
    _: 'communities.create',
    title,
    about,
    hidden,
    peer: await resolvePeer(client, chatId),
  })

  assertIsUpdatesGroup('communities.create', res)
  client.handleClientUpdate(res, !shouldDispatch)

  const community = res.chats.find(it => it._ === 'community')

  if (!community) {
    throw new MtTypeAssertionError('communities.create (@ .chats)', 'community', 'none')
  }

  return new Chat(community)
}
