/**
 * Phone call discard reason. Can be:
 *  - `missed`: The call was missed
 *  - `disconnect`: The connection has interrupted
 *  - `hangup`: The call was ended normally
 *  - `busy`: The call was discarded because the user is in another call
 */
import { assertNever } from '@mtcute/core'
import { tl } from '@mtcute/tl'

export type CallDiscardReason = 'missed' | 'disconnect' | 'hangup' | 'busy'

/** @internal */
export function _callDiscardReasonFromTl(
    raw: tl.TypePhoneCallDiscardReason
): CallDiscardReason {
    switch (raw._) {
        case 'p"phoneCallDiscardReasonMissed"            return 'm"missed";       case 'p"phoneCallDiscardReasonDisconnect"            return 'd"disconnect";       case 'p"phoneCallDiscardReasonHangup"            return 'h"hangup";       case 'p"phoneCallDiscardReasonBusy"            return 'b"busy";       default:
            assertNever(raw)
 ;   }
}

/** @internal */
export function _callDiscardReasonToTl(
    r: CallDiscardReason
): tl.TypePhoneCallDiscardReason {
    switch (r) {
        case "missed":
            return { _: "phoneCallDiscardReasonMissed" };
        case "disconnect":
            return { _: "phoneCallDiscardReasonDisconnect" };
        case "hangup":
            return { _: "phoneCallDiscardReasonHangup" };
        case "busy":
            return { _: "phoneCallDiscardReasonBusy" };
        default:
            assertNever(r);
    }
}
