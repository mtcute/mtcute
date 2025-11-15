import type { tl } from '@mtcute/tl'

import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike } from '../../types/peers/peer.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { MtInvalidPeerTypeError } from '../../types/errors.js'
import { isInputPeerChannel, isInputPeerUser, normalizeDate, toInputChannel, toInputUser } from '../../utils/index.js'
import { isSelfPeer } from '../auth/utils.js'

import { resolvePeer } from './resolve-peer.js'

/**
 * Set an emoji status for the given user/chat
 *
 * You can change emoji status of:
 *  - yourself (`self`)
 *  - supergroups or channels with enough boosts which you are an admin of
 *  - for bots – users who gave you the appropriate permissions
 */
export async function setEmojiStatus(
  client: ITelegramClient,
  params: {
    /** User or chat where the emoji status should be set */
    peerId: InputPeerLike
    /** Custom emoji ID or `null` to remove the emoji */
    emoji: tl.Long | null
    /** When true, `emoji` is the ID of the collectible emoji */
    isCollectible?: boolean
    /**
     * Date when the emoji status should expire (only if `emoji` is not `null`)
     */
    until?: number | Date
  },
): Promise<void> {
  const {
    peerId,
    emoji,
    until,
    isCollectible,
  } = params

  const peer = await resolvePeer(client, peerId)

  let emojiStatus: tl.TypeEmojiStatus

  if (emoji === null) {
    emojiStatus = { _: 'emojiStatusEmpty' }
  } else if (isCollectible) {
    emojiStatus = {
      _: 'inputEmojiStatusCollectible',
      collectibleId: emoji,
      until: normalizeDate(until),
    }
  } else {
    emojiStatus = {
      _: 'emojiStatus',
      documentId: emoji,
      until: normalizeDate(until),
    }
  }

  if (isSelfPeer(client, peer)) {
    const r = await client.call({
      _: 'account.updateEmojiStatus',
      emojiStatus,
    })

    assertTrue('account.updateEmojiStatus', r)
  } else if (isInputPeerChannel(peer)) {
    const r = await client.call({
      _: 'channels.updateEmojiStatus',
      channel: toInputChannel(peer),
      emojiStatus,
    })

    client.handleClientUpdate(r)
  } else if (isInputPeerUser(peer)) {
    const r = await client.call({
      _: 'bots.updateUserEmojiStatus',
      userId: toInputUser(peer),
      emojiStatus,
    })

    assertTrue('bots.updateUserEmojiStatus', r)
  } else {
    throw new MtInvalidPeerTypeError(peerId, 'user or channel')
  }
}
