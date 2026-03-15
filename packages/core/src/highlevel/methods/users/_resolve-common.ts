import type { InputPeerLike } from '../../types/index.js'
import { unreachable } from '@fuman/utils'
import { tl } from '../../../tl/index.js'
import { MtTypeAssertionError } from '../../../types/errors.js'
import { getMarkedPeerId, toggleChannelIdMark } from '../../../utils/peer-utils.js'
import { MtPeerNotFoundError } from '../../types/errors.js'
import { toInputPeer } from '../../utils/peer-utils.js'

export function _normalizePeerId(peerId: InputPeerLike): number | string | tl.TypeInputPeer {
  // for convenience we also accept tl and User/Chat objects directly
  if (typeof peerId === 'object') {
    if (tl.isAnyPeer(peerId)) {
      peerId = getMarkedPeerId(peerId)
    } else if ('inputPeer' in peerId) {
      // User | Chat
      peerId = peerId.inputPeer
    } else {
      peerId = toInputPeer(peerId)
    }
  }

  if (typeof peerId === 'object') {
    switch (peerId._) {
      case 'mtcute.dummyInputPeerMinUser':
        return peerId.userId
      case 'mtcute.dummyInputPeerMinChannel':
        return toggleChannelIdMark(peerId.channelId)
      default:
        return peerId
    }
  }

  return peerId
}

export function _handleContactsResolvedPeer(
  peerId: string,
  res: tl.contacts.TypeResolvedPeer,
): tl.TypeInputPeer {
  if (res.peer._ === 'peerUser') {
    const id = res.peer.userId

    const found = res.users.find(it => it.id === id)

    if (found && found._ === 'user') {
      if (!found.accessHash) {
        // no access hash, we can't use it
        // this may happen when bot resolves a username
        // of a user who hasn't started a conversation with it
        throw new MtPeerNotFoundError(
          `Peer (user) with username ${peerId} was found, but it has no access hash`,
        )
      }

      return {
        _: 'inputPeerUser',
        userId: found.id,
        accessHash: found.accessHash,
      }
    }
  } else if (res.peer._ === 'peerChannel') {
    const id = res.peer.channelId
    const found = res.chats.find(it => it.id === id)

    if (found) {
      if (!(found._ === 'channel' || found._ === 'channelForbidden')) {
        // chats can't have usernames
        // furthermore, our id is a channel id, so it must be a channel
        // this should never happen, unless Telegram goes crazy
        throw new MtTypeAssertionError('ResolvedPeer#chats', 'channel', found._)
      }

      if (!found.accessHash) {
        // shouldn't happen? but just in case
        throw new MtPeerNotFoundError(`Peer (channel) with ${peerId} was found, but it has no access hash`)
      }

      return {
        _: 'inputPeerChannel',
        channelId: found.id,
        accessHash: found.accessHash,
      }
    }
  } else {
    // chats can't have usernames
    throw new MtTypeAssertionError('ResolvedPeer#peer', 'user or channel', res.peer._)
  }

  unreachable()
}
