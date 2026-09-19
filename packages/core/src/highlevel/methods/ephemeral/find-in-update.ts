import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'

import { MtcuteError } from '../../../types/errors.js'
import { EphemeralMessage, PeersIndex } from '../../types/index.js'
import { assertIsUpdatesGroup } from '../../updates/utils.js'

/**
 * @internal
 * @noemit
 */
export function _findEphemeralMessageInUpdate(
  client: ITelegramClient,
  res: tl.TypeUpdates,
  isEdit = false,
  noDispatch = true,
): EphemeralMessage {
  assertIsUpdatesGroup(res)

  client.handleClientUpdate(res, noDispatch)

  for (const u of res.updates) {
    if (u._ !== 'updateNewEphemeralMessage' && u._ !== 'updateEditEphemeralMessage') continue
    if (isEdit !== (u._ === 'updateEditEphemeralMessage')) continue

    const peers = PeersIndex.from(res)

    return new EphemeralMessage(u.message, peers)
  }

  throw new MtcuteError('Response does not contain updateNewEphemeralMessage | updateEditEphemeralMessage')
}
