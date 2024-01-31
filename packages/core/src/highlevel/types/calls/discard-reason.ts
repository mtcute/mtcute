import { tl } from '@mtcute/tl'

import { assertNever } from '../../../types/utils.js'

/**
 * Phone call discard reason. Can be:
 *  - `missed`: The call was missed
 *  - `disconnect`: The connection has interrupted
 *  - `hangup`: The call was ended normally
 *  - `busy`: The call was discarded because the user is in another call
 */
export type CallDiscardReason = 'missed' | 'disconnect' | 'hangup' | 'busy'

/** @internal */
export function _callDiscardReasonFromTl(raw: tl.TypePhoneCallDiscardReason): CallDiscardReason {
    switch (raw._) {
        case 'phoneCallDiscardReasonMissed':
            return 'missed'
        case 'phoneCallDiscardReasonDisconnect':
            return 'disconnect'
        case 'phoneCallDiscardReasonHangup':
            return 'hangup'
        case 'phoneCallDiscardReasonBusy':
            return 'busy'
        default:
            assertNever(raw)
    }
}

/** @internal */
export function _callDiscardReasonToTl(r: CallDiscardReason): tl.TypePhoneCallDiscardReason {
    switch (r) {
        case 'missed':
            return { _: 'phoneCallDiscardReasonMissed' }
        case 'disconnect':
            return { _: 'phoneCallDiscardReasonDisconnect' }
        case 'hangup':
            return { _: 'phoneCallDiscardReasonHangup' }
        case 'busy':
            return { _: 'phoneCallDiscardReasonBusy' }
        default:
            assertNever(r)
    }
}
