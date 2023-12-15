import { MtTypeAssertionError, tl } from '@mtcute/core'

// dummy updates which are used for methods that return messages.affectedHistory.
// that is not an update, but it carries info about pts, and we need to handle it

/**
 * Create a dummy `updates` container with given updates.
 */
export function createDummyUpdatesContainer(updates: tl.TypeUpdate[], seq = 0): tl.TypeUpdates {
    return {
        _: 'updates',
        seq,
        date: 0,
        chats: [],
        users: [],
        updates,
    }
}

/**
 * Create a dummy update from PTS and PTS count.
 *
 * @param pts  PTS
 * @param ptsCount  PTS count
 * @param channelId  Channel ID (bare), if applicable
 */
export function createDummyUpdate(pts: number, ptsCount: number, channelId = 0): tl.TypeUpdates {
    return createDummyUpdatesContainer([
        {
            _: 'mtcute.dummyUpdate',
            channelId,
            pts,
            ptsCount,
        },
    ])
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
