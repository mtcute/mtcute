import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'

/**
 * Information about colors of a chat
 */
export class ChatColors {
    constructor(
        private readonly _peerId: number,
        readonly raw?: tl.RawPeerColor,
    ) {}

    /**
     * Color ID
     *
     * Note that this value is **not** an RGB color representation. Instead, it is
     * a number which should be used to pick a color from a predefined
     * list of colors:
     *  - `0-6` are the default colors used by Telegram clients:
     *    `red, orange, purple, green, sea, blue, pink`
     *  - `>= 7` are returned by `help.getAppConfig`.
     */
    get color(): number {
        return this.raw?.color ?? this._peerId % 7
    }

    /**
     * ID of the emoji that should be used as a background pattern
     * when rendering the color
     */
    get backgroundEmojiId(): tl.Long | null {
        return this.raw?.backgroundEmojiId ?? null
    }
}

makeInspectable(ChatColors)
