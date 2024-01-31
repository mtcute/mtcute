import { tl } from '@mtcute/tl'

import { MtTypeAssertionError } from '../../types/errors.js'
import { PeersIndex } from '../types/peers/peers-index.js'
import type { PendingUpdate } from './types.js'

export function messageToUpdate(message: tl.TypeMessage): tl.TypeUpdate {
    switch (message.peerId!._) {
        case 'peerUser':
        case 'peerChat':
            return {
                _: 'updateNewMessage',
                message,
                pts: 0,
                ptsCount: 0,
            }
        case 'peerChannel':
            return {
                _: 'updateNewChannelMessage',
                message,
                pts: 0,
                ptsCount: 0,
            }
    }
}

export function extractChannelIdFromUpdate(upd: tl.TypeUpdate): number | undefined {
    // holy shit
    let res = 0

    if ('channelId' in upd) {
        res = upd.channelId
    } else if (
        'message' in upd &&
        typeof upd.message !== 'string' &&
        'peerId' in upd.message &&
        upd.message.peerId &&
        'channelId' in upd.message.peerId
    ) {
        res = upd.message.peerId.channelId
    }

    if (res === 0) return undefined

    return res
}

export function toPendingUpdate(upd: tl.TypeUpdate, peers: PeersIndex, fromDifference = false): PendingUpdate {
    const channelId = extractChannelIdFromUpdate(upd) || 0
    const pts = 'pts' in upd ? upd.pts : undefined
    // eslint-disable-next-line no-nested-ternary
    const ptsCount = 'ptsCount' in upd ? upd.ptsCount : pts ? 0 : undefined
    const qts = 'qts' in upd ? upd.qts : undefined

    return {
        update: upd,
        channelId,
        pts,
        ptsBefore: pts ? pts - ptsCount! : undefined,
        qts,
        qtsBefore: qts ? qts - 1 : undefined,
        peers,
        fromDifference,
    }
}

export function isMessageEmpty(upd: tl.TypeUpdate): boolean {
    return (upd as Extract<typeof upd, { message: object }>).message?._ === 'messageEmpty'
}

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
