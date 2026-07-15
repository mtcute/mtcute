import type { ITelegramClient } from '../../client.types.js'

import type { InputPeerLike } from '../../types/index.js'
import { resolveChannel } from '../users/resolve-peer.js'

/**
 * Toggle whether a community is collapsed in the dialogs list
 */
export async function toggleCommunityCollapsed(
  client: ITelegramClient,
  params: {
    /** Community ID */
    communityId: InputPeerLike

    /** Whether the community should be collapsed */
    collapsed: boolean

    /**
     * Whether to dispatch the returned updates
     * to the client's update handler.
     */
    shouldDispatch?: true
  },
): Promise<void> {
  const { communityId, collapsed, shouldDispatch } = params

  const res = await client.call({
    _: 'communities.toggleCommunityCollapsedInDialogs',
    community: await resolveChannel(client, communityId),
    collapsed: collapsed || undefined,
  })

  client.handleClientUpdate(res, !shouldDispatch)
}
