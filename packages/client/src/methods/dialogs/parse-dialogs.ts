import { getMarkedPeerId, tl } from '@mtcute/core'
import { assertTypeIsNot } from '@mtcute/core/utils'

import { TelegramClient } from '../../client'
import { Dialog, PeersIndex } from '../../types'

/** @internal */
export function _parseDialogs(
    this: TelegramClient,
    res: tl.messages.TypeDialogs | tl.messages.TypePeerDialogs,
): Dialog[] {
    assertTypeIsNot('parseDialogs', res, 'messages.dialogsNotModified')

    const peers = PeersIndex.from(res)

    const messages: Record<number, tl.TypeMessage> = {}
    res.messages.forEach((msg) => {
        if (!msg.peerId) return

        messages[getMarkedPeerId(msg.peerId)] = msg
    })

    return res.dialogs
        .filter((it) => it._ === 'dialog')
        .map((it) => new Dialog(this, it as tl.RawDialog, peers, messages))
}
