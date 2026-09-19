import type { tl } from '../../../tl/index.js'

import type { ITelegramClient } from '../../client.types.js'
import { MtcuteError } from '../../../types/errors.js'
import { Poll } from '../../types/media/poll.js'
import { PeersIndex } from '../../types/peers/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'

/**
 * @internal
 * @noemit
 */
export function _findPollInUpdate(
  client: ITelegramClient,
  res: tl.TypeUpdates,
  noDispatch: boolean,
  knownPoll?: Poll,
): Poll {
  assertIsUpdatesGroup(res)

  client.handleClientUpdate(res, noDispatch)

  const upd = res.updates.find((it): it is tl.RawUpdateMessagePoll => it._ === 'updateMessagePoll')
  if (!upd) {
    throw new MtcuteError('Response does not contain updateMessagePoll')
  }

  if (upd.poll) {
    return new Poll(upd.poll, PeersIndex.from(res), upd.results, knownPoll?.attachedMedia)
  }

  if (!knownPoll) {
    throw new MtcuteError('updateMessagePoll does not contain poll')
  }

  const peers = PeersIndex.from({
    users: [...knownPoll._peers.users.values(), ...res.users],
    chats: [...knownPoll._peers.chats.values(), ...res.chats],
  })

  return new Poll(knownPoll.raw, peers, upd.results, knownPoll.attachedMedia)
}
