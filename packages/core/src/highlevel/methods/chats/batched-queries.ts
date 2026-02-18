import type { ITelegramClient } from '../../client.types.js'

import type { BatchedQuery } from '../../utils/query-batcher.js'
import { tl } from '@mtcute/tl'
import { MtArgumentError } from '../../../types/errors.js'
import {
  isInputPeerChannel,
  isInputPeerChat,
  isInputPeerUser,
  toInputChannel,
  toInputUser,
} from '../../utils/peer-utils.js'
import { batchedQuery } from '../../utils/query-batcher.js'

/** @internal */
export const _getUsersBatched: BatchedQuery<tl.TypeInputUser, tl.TypeUser> = batchedQuery({
  fetch: (client, items) =>
    client
      .call({
        _: 'users.getUsers',
        id: items,
        // there's actually not much point in filtering, since telegram currently simply omits the missing users
        // but maybe it will change in the future and i don't want to think about it
      })
      .then(res => res.filter(it => it._ !== 'userEmpty')),
  inputKey: (item, client) => {
    switch (item._) {
      case 'inputUser':
      case 'inputUserFromMessage':
        return item.userId
      case 'inputUserSelf':
        return client.storage.self.getCached()!.userId
      default:
        throw new MtArgumentError('Invalid input user')
    }
  },
  outputKey: item => item.id,
  maxBatchSize: 50,
  maxConcurrent: 3,
  retrySingleOnError: (items, err) => {
    if (!tl.RpcError.is(err)) return false

    let fromMessageCount = 0

    for (const item of items) {
      if (item._ === 'inputUserFromMessage') fromMessageCount++
    }

    if (fromMessageCount === 0) {
      // no point in retrying, the error is likely not related to the inputUserFromMessage
      return false
    }

    switch (err.text) {
      case 'CHANNEL_INVALID':
      case 'USER_BANNED_IN_CHANNEL':
      case 'CHANNEL_PRIVATE':
      case 'MSG_ID_INVALID':
        return true
      default:
        return false
    }
  },
})

/** @internal */
export const _getChatsBatched: BatchedQuery<number, tl.RawChat | tl.RawChatForbidden> = batchedQuery({
  fetch: (client, items) =>
    client
      .call({
        _: 'messages.getChats',
        id: items,
      })
      .then(res => res.chats.filter(it => it._ === 'chat' || it._ === 'chatForbidden')),
  inputKey: id => id,
  outputKey: item => item.id,
  maxBatchSize: 50,
  maxConcurrent: 3,
})

/** @internal */
export const _getChannelsBatched: BatchedQuery<
  tl.TypeInputChannel,
    tl.RawChannel | tl.RawChannelForbidden
> = batchedQuery({
  fetch: (client, items) =>
    client.call({
      _: 'channels.getChannels',
      id: items,
    }).then(res =>
      res.chats.filter(it => it._ === 'channel' || it._ === 'channelForbidden'),
    ),
  inputKey: (id) => {
    switch (id._) {
      case 'inputChannel':
      case 'inputChannelFromMessage':
        return id.channelId
      default:
        throw new MtArgumentError('Invalid input channel')
    }
  },
  outputKey: item => item.id,
  maxBatchSize: 50,
  maxConcurrent: 3,
  retrySingleOnError: (items, err) => {
    if (!tl.RpcError.is(err)) return false

    let fromMessageCount = 0

    for (const item of items) {
      if (item._ === 'inputChannelFromMessage') fromMessageCount++
    }

    if (fromMessageCount === 0) {
      // no point in retrying, the error is likely not related to the inputChannelFromMessage
      return false
    }

    switch (err.text) {
      case 'CHANNEL_INVALID':
      case 'USER_BANNED_IN_CHANNEL':
      case 'CHANNEL_PRIVATE':
      case 'MSG_ID_INVALID':
        return true
      default:
        return false
    }
  },
})

/** @internal */
export function _getRawPeerBatched(
  client: ITelegramClient,
  peer: tl.TypeInputPeer,
): Promise<tl.TypeUser | tl.TypeChat | null> {
  if (isInputPeerUser(peer)) {
    return _getUsersBatched(client, toInputUser(peer))
  } else if (isInputPeerChannel(peer)) {
    return _getChannelsBatched(client, toInputChannel(peer))
  } else if (isInputPeerChat(peer)) {
    return _getChatsBatched(client, peer.chatId)
  }

  throw new MtArgumentError('Invalid peer')
}
