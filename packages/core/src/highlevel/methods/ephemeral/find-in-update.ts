import type { tl } from '../../../tl/index.js'
import type { ITelegramClient } from '../../client.types.js'

import { MtTypeAssertionError } from '../../../types/errors.js'
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
  assertIsUpdatesGroup('_findEphemeralMessageInUpdate', res)

  client.handleClientUpdate(res, noDispatch)

  for (const u of res.updates) {
    if (u._ !== 'updateNewEphemeralMessage' && u._ !== 'updateEditEphemeralMessage') continue
    if (isEdit !== (u._ === 'updateEditEphemeralMessage')) continue

    const peers = PeersIndex.from(res)

    return new EphemeralMessage(u.message, peers)
  }

  throw new MtTypeAssertionError(
    '_findEphemeralMessageInUpdate (@ .updates[*])',
    'updateNewEphemeralMessage | updateEditEphemeralMessage',
    'none',
  )
}
