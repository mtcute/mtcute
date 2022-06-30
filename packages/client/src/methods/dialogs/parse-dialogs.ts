import { tl } from '@mtcute/tl'
import { getMarkedPeerId } from '@mtcute/core'

import { TelegramClient } from '../../client'
import { Dialog, MtTypeAssertionError, PeersIndex } from '../../types'

/** @internal */
export function _parseDialogs(
    this: TelegramClient,
    res: tl.messages.TypeDialogs | tl.messages.TypePeerDialogs
): Dialog[] {
    if (res._ === 'messages.dialogsNotModified')
        throw new MtTypeAssertionError(
            'messages.getPeerDialogs',
            '!messages.dialogsNotModified',
            'messages.dialogsNotModified'
        )

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
