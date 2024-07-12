import {
    BusinessCallbackQuery,
    CallbackQuery,
    InlineCallbackQuery,
    MaybeArray,
    MaybePromise,
    MtArgumentError,
} from '@mtcute/core'

import { UpdateFilter } from './filters/types.js'

/**
 * Callback data builder, inspired by [aiogram](https://github.com/aiogram/aiogram).
 *
 * This can be used to simplify management of different callbacks.
 *
 * [Learn more in the docs](/guide/topics/keyboards.html#callback-data-builders)
 */
export class CallbackDataBuilder<T extends string> {
    private readonly _fields: T[]

    sep = ':'

    /**
     * @param prefix  Prefix for the data. Use something unique across your bot.
     * @param fields  Field names in the order they will be serialized.
     */
    constructor(
        public prefix: string,
        ...fields: T[]
    ) {
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

                    if (val.includes(this.sep)) {
                        throw new MtArgumentError(
                            `Value for ${f} ${val} contains separator ${this.sep} and cannot be used.`,
                        )
                    }

                    return val
                })
                .join(this.sep)

        if (ret.length > 64) {
            throw new MtArgumentError('Resulting callback data is too long.')
        }

        return ret
    }

    /**
     * Parse callback data to object
     *
     * @param data  Callback data as string
     * @param safe  If `true`, will return `null` instead of throwing on invalid data
     */
    parse(data: string, safe?: false): Record<T, string>
    parse(data: string, safe: true): Record<T, string> | null
    parse(data: string, safe = false): Record<T, string> | null {
        const parts = data.split(this.sep)

        if (parts[0] !== this.prefix) {
            if (safe) return null
            throw new MtArgumentError(
                `Invalid data passed: "${data}" (bad prefix, expected ${this.prefix}, got ${parts[0]})`,
            )
        }

        if (parts.length !== this._fields.length + 1) {
            if (safe) return null
            throw new MtArgumentError(
                `Invalid data passed: "${data}" (bad parts count, expected ${this._fields.length}, got ${
                    parts.length - 1
                })`,
            )
        }

        const ret = {} as Record<T, string>
        parts.forEach((it, idx) => {
            if (idx === 0) return // skip prefix

            ret[this._fields[idx - 1]] = it
        })

        return ret
    }

    /**
     * Create a filter for this callback data.
     *
     * You can either pass an object with field names as keys and values as strings or regexes,
     * which will be compiled to a RegExp, or a function that will be called with the parsed data.
     * Note that the strings will be passed to `RegExp` **directly**, so you may want to escape them.
     *
     * When using a function, you can either return a boolean, or an object with field names as keys
     * and values as strings or regexes. In the latter case, the resulting object will be matched
     * against the parsed data the same way as if you passed it directly.
     *
     * @param params
     */
    filter<Update extends CallbackQuery | InlineCallbackQuery | BusinessCallbackQuery>(
        params:
            | ((
                  upd: Update,
                  parsed: Record<T, string>,
              ) => MaybePromise<Partial<Record<T, MaybeArray<string | RegExp>>> | boolean>)
            | Partial<Record<T, MaybeArray<string | RegExp>>> = {},
    ): UpdateFilter<
        Update,
        {
            match: Record<T, string>
        }
    > {
        if (typeof params === 'function') {
            return async (query) => {
                if (!query.dataStr) return false

                const data = this.parse(query.dataStr, true)
                if (!data) return false

                const fnResult = await params(query, data)

                if (typeof fnResult === 'boolean') {
                    (
                        query as Update & {
                            match: Record<T, string>
                        }
                    ).match = data

                    return fnResult
                }

                // validate result
                for (const key in fnResult) {
                    const value = data[key]
                    if (value === undefined) return false

                    let matchers = fnResult[key] as MaybeArray<string | RegExp>
                    if (!Array.isArray(matchers)) matchers = [matchers]

                    for (const matcher of matchers) {
                        if (typeof matcher === 'string') {
                            if (value !== matcher) return false
                        } else if (!matcher.test(value)) return false
                    }
                }

                (
                    query as Update & {
                        match: Record<T, string>
                    }
                ).match = data

                return true
            }
        }

        const parts: string[] = []

        this._fields.forEach((field) => {
            if (!(field in params)) {
                parts.push(`[^${this.sep}]*?`)

                return
            }

            const value = params[field]

            if (Array.isArray(value)) {
                parts.push(`(${value.map((i) => (typeof i === 'string' ? i : i.source)).join('|')})`)
            } else {
                // noinspection SuspiciousTypeOfGuard
                parts.push(typeof value === 'string' ? value : (value as RegExp).source)
            }
        })

        const regex = new RegExp(`^${this.prefix}${this.sep}${parts.join(this.sep)}$`)

        return (query) => {
            const m = query.dataStr?.match(regex)
            if (!m) return false
            ;(
                query as Update & {
                    match: Record<T, string>
                }
            ).match = this.parse(m[0])

            return true
        }
    }
}
