import { TelegramClient } from '../../client'
import { Dialog } from '../../types'
import { normalizeDate } from '../../utils/misc-utils'
import { createUsersChatsIndex } from '../../utils/peer-utils'
import { MtCuteTypeAssertionError } from '../../types'
import { tl } from '@mtcute/tl'
import { getMarkedPeerId } from '@mtcute/core'

/**
 * Get a chunk of dialogs
 *
 * You can get up to 100 dialogs at once
 *
 * @param params  Fetch parameters
 * @internal
 */
export async function getDialogs(
    this: TelegramClient,
    params?: {
        /**
         * Offset date used as an anchor for pagination.
         *
         * Use {@link Dialog.date} for this value.
         */
        offsetDate?: Date | number

        /**
         * Limits the number of dialogs to be received.
         *
         * Defaults to 100.
         */
        limit?: number

        /**
         * How to handle pinned dialogs?
         * Whether to `include` them, `exclude`,
         * or `only` return pinned dialogs.
         *
         * Defaults to `include`
         */
        pinned?: 'include' | 'exclude' | 'only'

        /**
         * Whether to get dialogs from the
         * archived dialogs list.
         */
        archived?: boolean
    }
): Promise<Dialog[]> {
    if (!params) params = {}

    let res
    if (params.pinned === 'only') {
        res = await this.call({
            _: 'messages.getPinnedDialogs',
            folderId: params.archived ? 1 : 0,
        })
    } else {
        res = await this.call({
            _: 'messages.getDialogs',
            excludePinned: params.pinned === 'exclude',
            folderId: params.archived ? 1 : 0,
            offsetDate: normalizeDate(params.offsetDate) ?? 0,

            // offseting by id and peer is useless because when some peer sends
            // a message, their dialog goes to the top and we get a cycle
            offsetId: 0,
            offsetPeer: { _: 'inputPeerEmpty' },

            limit: params.limit ?? 100,
            hash: 0,
        })
    }

    if (res._ === 'messages.dialogsNotModified')
        throw new MtCuteTypeAssertionError(
            'getDialogs',
            '!messages.dialogsNotModified',
            'messages.dialogsNotModified'
        )

    const { users, chats } = createUsersChatsIndex(res)

    const messages: Record<number, tl.TypeMessage> = {}
    res.messages.forEach((msg) => {
        if (!msg.peerId) return

        messages[getMarkedPeerId(msg.peerId)] = msg
    })

    return res.dialogs
        .filter(it => it._ === 'dialog')
        .map(it => new Dialog(this, it as tl.RawDialog, users, chats, messages))
}
