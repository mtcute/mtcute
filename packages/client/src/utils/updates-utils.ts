import { tl } from '@mtcute/tl'
import { MtCuteTypeAssertionError } from '../types'

// dummy updates which are used for methods that return messages.affectedHistory.
// that is not an update, but it carries info about pts, and we need to handle it

/** @internal */
export function createDummyUpdate(
    pts: number,
    ptsCount: number,
    channelId = 0
): tl.TypeUpdates {
    return {
        _: 'updates',
        seq: 0,
        date: 0,
        chats: [],
        users: [],
        updates: [
            {
                _: 'updatePinnedChannelMessages',
                channelId,
                pts,
                ptsCount,
                // since message id cant be negative, using negative 42
                // here makes it distinctive from real updates
                messages: [-42],
            },
        ],
    }
}

/** @internal */
export function isDummyUpdate(upd: tl.TypeUpdate): boolean {
    return (
        upd._ === 'updatePinnedChannelMessages' &&
        upd.messages.length === 1 &&
        upd.messages[0] === -42
    )
}

/** @internal */
export function isDummyUpdates(upd: tl.TypeUpdates): boolean {
    return (
        upd._ === 'updates' &&
        upd.updates.length === 1 &&
        isDummyUpdate(upd.updates[0])
    )
}

/** @internal */
export function assertIsUpdatesGroup(
    ctx: string,
    upd: tl.TypeUpdates
): asserts upd is tl.RawUpdates | tl.RawUpdatesCombined {
    switch (upd._) {
        case 'updates':
        case 'updatesCombined':
            return
    }
    throw new MtCuteTypeAssertionError(ctx, 'updates | updatesCombined', upd._)
}
