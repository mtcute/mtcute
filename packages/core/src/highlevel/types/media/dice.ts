import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'

/**
 * A dice or another interactive random emoji.
 */
export class Dice {
    readonly type = 'dice' as const

    /**
     * A simple 6-sided dice.
     *
     * {@link value} represents its value (1-6)
     */
    static readonly TYPE_DICE = '🎲'

    /**
     * A dart. Telegram dart has 4 rings and middle.
     *
     * {@link value} represents the position of the dart:
     * ![Dart position graph](https://i.imgur.com/iPBm7HG.png)
     */
    static readonly TYPE_DART = '🎯'

    /**
     * A basketball thrown into a hoop.
     *
     * {@link value} represents the motion of the ball:
     *  - 1: simple miss (ball hits right part, bounces to the left)
     *  - 2: first hit the ring, then miss
     *  - 3: ball gets stuck between the ring and the base
     *  - 4: first hit the ring, then score
     *  - 5: direct score
     */
    static readonly TYPE_BASKETBALL = '🏀'

    /**
     * A football thrown to the gate.
     *
     * {@link value} represents the motion of the ball:
     *  - 1: flies above the top barbell
     *  - 2: hits right barbell, then miss
     *  - 3: direct score in the middle
     *  - 4: hits left barbell, then score, then hits right barbell
     *  - 5: score in the top-right corner
     */
    static readonly TYPE_FOOTBALL = '⚽️'

    /**
     * A bowling ball thrown to pins.
     *
     * Assuming the following identifiers for the pins:
     * ```
     * 4 5 6
     *  2 3
     *   1
     * ```
     *
     * {@link value} represents the motion of the ball and pins:
     *  - 1: the ball touched 6th pin, none are down
     *  - 2: the ball hit 4th pin, only 4th pin is down.
     *  - 3: the ball hit 1st pin, pins 1, 2, 5 are down, leaving pins 3, 4, 6
     *  - 4: the ball hit 1st pin on the right side, all the pins except 2nd and 6th are down
     *  - 5: the ball hit 3rd pin and all the pins except 2nd are down.
     *  - 6: the ball hit 1st pin and all pins are down
     */
    static readonly TYPE_BOWLING = '🎳'

    /**
     * A slot machine.
     *
     * {@link value} represents the result of the machine.
     * Value itself is an integer in range `[1, 64]`,
     * and is composed out of several parts.
     *
     * > **Note**: The following information is based on the TDesktop
     * > implementation. These are the relevant files:
     * >  - [`chat_helpers/stickers_dice_pack.cpp`](https://github.com/telegramdesktop/tdesktop/blob/dev/Telegram/SourceFiles/chat_helpers/stickers_dice_pack.cpp)
     * >  - [`history/view/media/history_view_slot_machine.cpp`](https://github.com/telegramdesktop/tdesktop/blob/dev/Telegram/SourceFiles/history/view/media/history_view_slot_machine.cpp)
     *
     * Unlike other animated dices, this does not have
     * all the possible combinations in the sticker set.
     * Instead, `value` is a specially encoded integer that contains
     * the information about the indexes.
     *
     * There are some base parts of the animations:
     *  - 0th sticker is the base background of the machine
     *  - 1st sticker is the background of the machine for the "winning" state (i.e. `777`)
     *  - 2nd sticker is the frame of the machine, including the handle
     *  - 8th sticker is the "idle" state for the left slot
     *  - 14th sticker is the "idle" state for the middle slot
     *  - 20th sticker is the "idle" state for the right slot
     *
     * The machine result is encoded as 3 concatenated two-bit integers,
     * and the resulting integer is incremented by one.
     *
     * So, to decode the value to its parts, you can use this code:
     * ```typescript
     * const computePartValue = (val: number, idx: number) => ((val - 1) >> (idx * 2)) & 0x03; // 0..3
     * const parts = [
     *   computePartValue(msg.media.value, 0),
     *   computePartValue(msg.media.value, 1),
     *   computePartValue(msg.media.value, 2),
     * ]
     * ```
     *
     * Each part of the value corresponds to a particular slot (i.e. part 0 is left slot,
     * part 1 is middle, part 2 is right). The slot values are as follows:
     *  - 0: BAR (displayed as a *BAR* sign on a black background)
     *  - 1: BERRIES (displayed as berries, similar to emoji 🍇)
     *  - 2: LEMON (displayed as a lemon, similar to emoji 🍋)
     *  - 3: SEVEN (displayed as a red digit 7)
     *
     * Therefore, the winning value (i.e. `777`) is represented as `(3 << 4 | 3 << 2 | 3 << 0) + 1 = 64`
     *
     * To determine the needed animation parts, you'll need to apply some shifts.
     * These are the offsets for the individual symbols:
     *  - WIN_SEVEN: 0
     *  - SEVEN: 1
     *  - BAR: 2
     *  - BERRIES: 3
     *  - LEMON: 4
     *
     * And these are the shifts for each slot:
     *  - LEFT: 3
     *  - MIDDLE: 9
     *  - RIGHT: 15
     *
     * > WIN_SEVEN is the same as SEVEN, but only used if the machine result is `777` (i.e. `value = 64`),
     * > as it contains additional "blinking" animation.
     *
     * The sticker index is computed as follows: `SHIFTS[SLOT] + OFFSETS[SYM]`.
     * For example, berries for the middle slot would be: `SHIFTS[MIDDLE] + OFFSETS[BERRIES] = 9 + 3 = 12`
     *
     * Currently, this sticker set is used for the machine: [SlotMachineAnimated](https://t.me/addstickers/SlotMachineAnimated)
     */
    static readonly TYPE_SLOTS = '🎰'

    constructor(readonly obj: tl.RawMessageMediaDice) {}

    /**
     * An emoji which was originally sent.
     *
     * See static members of {@link Dice} for a list
     * of possible values
     */
    get emoji(): string {
        return this.obj.emoticon
    }

    /**
     * Emoji's interactive value.
     *
     * See what this value represents in the corresponding
     * type's documentation (in {@link Dice} static fields)
     */
    get value(): number {
        return this.obj.value
    }

    /**
     * Input media TL object generated from this object,
     * to be used inside {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}
     *
     * Note that when you use this media, a new `value`
     * will be generated!
     */
    get inputMedia(): tl.TypeInputMedia {
        return {
            _: 'inputMediaDice',
            emoticon: this.obj.emoticon,
        }
    }
}

makeInspectable(Dice, undefined, ['inputMedia'])
