import { MaybeArray } from '@mtqt/core'
import { CallbackQuery, MtqtArgumentError } from '@mtqt/client'
import { UpdateFilter } from './filters'

/**
 * Callback data builder, inspired by [aiogram](https://github.com/aiogram/aiogram).
 *
 * This can be used to simplify management of different callbacks.
 *
 * [Learn more in the docs](//mt.tei.su/guide/topics/keyboards.html#callback-data-builders)
 */
export class CallbackDataBuilder<T extends string> {
    private readonly _fields: T[]

    sep = ':'

    /**
     * @param prefix  Prefix for the data. Use something unique across your bot.
     * @param fields  Field names in the order they will be serialized.
     */
    constructor(public prefix: string, ...fields: T[]) {
        this._fields = fields
    }

    /**
     * Build a callback data string
     *
     * @param obj  Object containing the data
     */
    build(obj: Record<T, string>): string {
        const ret =
            this.prefix +
            this.sep +
            this._fields
                .map((f) => {
                    const val = obj[f]

                    if (val.indexOf(this.sep) > -1)
                        throw new MtqtArgumentError(
                            `Value for ${f} ${val} contains separator ${this.sep} and cannot be used.`
                        )

                    return val
                })
                .join(this.sep)

        if (ret.length > 64) {
            throw new MtqtArgumentError(
                'Resulting callback data is too long.'
            )
        }

        return ret
    }

    /**
     * Parse callback data to object
     *
     * @param data  Callback data as string
     */
    parse(data: string): Record<T, string> {
        const parts = data.split(this.sep)

        if (parts[0] !== this.prefix) {
            throw new MtqtArgumentError('Invalid data passed')
        }

        if (parts.length !== this._fields.length + 1) {
            throw new MtqtArgumentError('Invalid data passed')
        }

        const ret = {} as Record<T, string>
        parts.forEach((it, idx) => {
            ret[this._fields[idx - 1]] = it
        })
        return ret
    }

    /**
     * Create a filter for this callback data.
     *
     * > **Note**: `params` object will be compiled to a RegExp,
     * > so avoid using characters that have special meaning in regex,
     * > or use RegExp directly to let the IDE guide you.
     *
     * @param params
     */
    filter(
        params: Partial<Record<T, MaybeArray<string | RegExp>>>
    ): UpdateFilter<
        CallbackQuery,
        {
            match: Record<T, string>
        }
    > {
        const parts: string[] = []

        this._fields.forEach((field) => {
            if (!(field in params)) {
                parts.push(`[^${this.sep}]*?`)
                return
            }

            const value = params[field]!
            if (Array.isArray(value)) {
                parts.push(
                    `(${value
                        .map((i) => (typeof i === 'string' ? i : i.source))
                        .join('|')})`
                )
            } else {
                parts.push(
                    typeof value === 'string' ? value : (value as RegExp).source
                )
            }
        })

        const regex = new RegExp(
            `^${this.prefix}${this.sep}${parts.join(this.sep)}$`
        )

        return (query) => {
            const m = query.dataStr?.match(regex)
            if (!m) return false
            ;(query as CallbackQuery & {
                match: Record<T, string>
            }).match = this.parse(m[0])
            return true
        }
    }
}

const a = new CallbackDataBuilder('post', 'foo', 'bar')

