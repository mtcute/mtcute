import { ITelegramClient } from '../../client.types.js'
import { Chat } from '../../types/index.js'
import { BoostSlot } from '../../types/premium/boost-slot.js'
import { getMyBoostSlots } from './get-my-boost-slots.js'

// @exported
export type CanApplyBoostResult =
    | { can: true; replace?: Chat[]; slots: BoostSlot[] }
    | { can: false; reason: 'need_premium'; slots: BoostSlot[] }
    | { can: false; reason: 'no_slots'; slots: BoostSlot[] }

/**
 * Check if the current user can apply boost to some channel
 *
 * @returns
 *   - `{ can: true }` if the user can apply boost
 *      - `.replace` - {@link Chat}s that can be replaced with the current one.
 *        If the user can apply boost without replacing any chats, this field will be `undefined`.
 *   - `{ can: false }` if the user can't apply boost
 *      - `.reason == "no_slots"` if the user has no available slots
 *      - `.reason == "need_premium"` if the user needs Premium to boost
 *   - In all cases, `slots` will contain all the current user's boost slots
 */
export async function canApplyBoost(client: ITelegramClient): Promise<CanApplyBoostResult> {
    const myBoosts = await getMyBoostSlots(client)

    if (!myBoosts.length) {
        return { can: false, reason: 'need_premium', slots: myBoosts }
    }

    const emptySlots = myBoosts.filter((it) => !it.occupied)

    if (emptySlots.length > 0) {
        return { can: true, slots: myBoosts }
    }

    const replaceableSlots = myBoosts.filter((it) => it.cooldownUntil === null)

    if (replaceableSlots.length) {
        return { can: true, replace: replaceableSlots.map((it) => it.chat!), slots: myBoosts }
    }

    return { can: false, reason: 'no_slots', slots: myBoosts }
}
