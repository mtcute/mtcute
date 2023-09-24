import { MtTypeAssertionError, tl } from '@mtcute/core'

// dummy updates which are used for methods that return messages.affectedHistory.
// that is not an update, but it carries info about pts, and we need to handle it

/**
 * Create a dummy update from PTS and PTS count.
 *
 * @param pts  PTS
 * @param ptsCount  PTS count
 * @param channelId  Channel ID (bare), if applicable
 */
export function createDummyUpdate(pts: number, ptsCount: number, channelId = 0): tl.TypeUpdates {
    return {
        _: 'updates',
        seq: 0,
        date: 0,
        chats: [],
        users: [],
        updates: [
            {
                _: 'dummyUpdate',
                channelId,
                pts,
                ptsCount,
            },
        ],
    }
}

/** @internal */
export function assertIsUpdatesGroup(
    ctx: string,
    upd: tl.TypeUpdates,
): asserts upd is tl.RawUpdates | tl.RawUpdatesCombined {
    switch (upd._) {
        case 'updates':
        case 'updatesCombined':
            return
    }
    throw new MtTypeAssertionError(ctx, 'updates | updatesCombined', upd._)
}
