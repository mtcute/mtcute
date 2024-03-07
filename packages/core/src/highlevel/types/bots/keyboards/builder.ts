import { tl } from '@mtcute/tl'

import type { InlineKeyboardMarkup, ReplyKeyboardMarkup } from './types.js'

export type ButtonLike = tl.TypeKeyboardButton | false | null | undefined | void

/**
 * Builder for bot keyboards
 */
export class BotKeyboardBuilder {
    private _buttons: tl.TypeKeyboardButton[][] = []

    constructor(readonly maxRowWidth: number | null = 3) {}

    /**
     * Add buttons, wrapping them once {@link maxRowWidth} is reached
     *
     * @param buttons  Buttons to add
     */
    push(...buttons: (ButtonLike | (() => ButtonLike))[]): this {
        if (!buttons.length) return this

        let row: tl.TypeKeyboardButton[] = []
        buttons.forEach((btn) => {
            if (typeof btn === 'function') btn = btn()
            if (!btn) return

            row.push(btn)

            if (row.length === this.maxRowWidth) {
                this._buttons.push(row)
                row = []
            }
        })

        if (row.length) {
            this._buttons.push(row)
        }

        return this
    }

    /**
     * Add a row of buttons. Will not be wrapped.
     *
     * @param row  Row or a function that will populate it
     */
    row(row: ButtonLike[] | ((arr: ButtonLike[]) => void)): this {
        if (typeof row === 'function') {
            const fn = row
            row = []
            fn(row)
        }

        const normal = row.filter(Boolean) as tl.TypeKeyboardButton[]
        if (normal.length) this._buttons.push(normal)

        return this
    }

    /**
     * Append a button to the last row, wrapping if needed.
     *
     * @param btn  Button to add
     * @param force  Whether to forcefully add the button (i.e. do not wrap)
     */
    append(btn: ButtonLike | (() => ButtonLike), force = false): this {
        if (typeof btn === 'function') btn = btn()
        if (!btn) return this

        if (
            this._buttons.length &&
            (this.maxRowWidth === null || force || this._buttons[this._buttons.length - 1].length < this.maxRowWidth)
        ) {
            this._buttons[this._buttons.length - 1].push(btn)
        } else {
            this._buttons.push([btn])
        }

        return this
    }

    /**
     * Return contents of this builder as an inline keyboard
     */
    asInline(): InlineKeyboardMarkup {
        return {
            type: 'inline',
            buttons: this._buttons,
        }
    }

    /**
     * Return contents of this builder as a reply keyboard
     */
    asReply(params: Omit<ReplyKeyboardMarkup, 'type' | 'buttons'> = {}): ReplyKeyboardMarkup {
        const ret = params as tl.Mutable<ReplyKeyboardMarkup>
        ret.type = 'reply'
        ret.buttons = this._buttons

        return ret
    }
}
