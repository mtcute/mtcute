import { writeFile } from 'node:fs/promises'

import { parse } from 'csv-parse/sync'
import type { TlErrors } from '@mtcute/tl-utils'
import { ffetchBase as ffetch } from '@fuman/fetch'

import { ERRORS_JSON_FILE } from './constants.js'

const ERRORS_PAGE_TG = 'https://corefork.telegram.org/api/errors'
const ERRORS_PAGE_TELETHON
    = 'https://raw.githubusercontent.com/LonamiWebs/Telethon/v1/telethon_generator/data/errors.csv'
const baseErrors = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    FLOOD: 420,
    SEE_OTHER: 303,
    NOT_ACCEPTABLE: 406,
    INTERNAL: 500,
} as const

interface TelegramErrorsSpec {
    errors: Record<string, Record<string, string[]>>
    descriptions: Record<string, string>
    user_only: string[]
    bot_only: string[]
}

async function fetchFromTelegram(errors: TlErrors) {
    const page = await ffetch(ERRORS_PAGE_TG).text()
    const jsonUrl = page.match(/can be found <a href="([^"]+)">here »<\/a>/i)?.[1]
    if (!jsonUrl) throw new Error('Cannot find JSON URL')

    const json = await ffetch(new URL(jsonUrl, ERRORS_PAGE_TG).href).json<TelegramErrorsSpec>()

    // since nobody fucking guarantees that .descriptions
    // will have description for each described here (or vice versa),
    // we will process them independently

    for (const code of Object.keys(json.errors)) {
        for (const name of Object.keys(json.errors[code])) {
            const thrownBy = json.errors[code][name]

            const _code = Number.parseInt(code)

            if (Number.isNaN(_code)) {
                throw new TypeError(`Invalid code: ${code}`)
            }

            if (!(name in errors.errors)) {
                errors.errors[name] = {
                    code: _code,
                    name,
                }
            }

            for (const method of thrownBy) {
                if (!(method in errors.throws)) {
                    errors.throws[method] = []
                }

                if (!errors.throws[method].includes(name)) {
                    errors.throws[method].push(name)
                }
            }
        }
    }

    for (const name of Object.keys(json.descriptions)) {
        if (!(name in errors.errors)) {
            errors.errors[name] = {
                _auto: true,
                code: 400,
                name,
            }
        }

        errors.errors[name].description = json.descriptions[name]
    }

    json.user_only.forEach((it: string) => (errors.userOnly[it] = 1))
    json.bot_only.forEach((it: string) => (errors.botOnly[it] = 1))

    // process _* wildcard errors
    // 1. add description to errors that are missing it
    // 2. replace all wildcards in errors.throws with all matching errors
    // 3. remove all _* such errors from errors.errors

    for (const name of Object.keys(errors.errors)) {
        if (!name.endsWith('_*')) continue

        const base = name.slice(0, -2)

        const matchingErrors: string[] = []

        for (const inner of Object.keys(errors.errors)) {
            if (!inner.startsWith(base) || inner === name) continue

            matchingErrors.push(inner)

            if (!errors.errors[inner].description) {
                errors.errors[inner].description = errors.errors[name].description
            }
        }

        if (matchingErrors.length === 0) continue

        for (const method of Object.keys(errors.throws)) {
            const idx = errors.throws[method].indexOf(name)
            if (idx === -1) continue

            errors.throws[method].splice(idx, 1, ...matchingErrors)
        }

        delete errors.errors[name]
    }

    // clean up: remove duplicates in throws
    for (const method of Object.keys(errors.throws)) {
        errors.throws[method] = [...new Set(errors.throws[method])]
    }
}

async function fetchFromTelethon(errors: TlErrors) {
    const csv = await ffetch(ERRORS_PAGE_TELETHON).text()

    const records = parse(csv, {
        columns: true,
        skip_empty_lines: true,
    }) as {
        name: string
        codes: string
        description: string
    }[]

    for (const { name: name_, codes, description } of records) {
        if (!codes) continue
        if (name_ === 'TIMEOUT') continue

        let name = name_
        const code = Number.parseInt(codes)

        if (Number.isNaN(code)) {
            throw new TypeError(`Invalid code: ${codes} (name: ${name})`)
        }

        // telethon uses X for parameters instead of printf-like
        // we'll convert it back to printf-like
        name = name.replace(/_X(_)?/g, '_%d$1')

        if (!(name in errors.errors)) {
            errors.errors[name] = {
                code,
                name,
            }
        }

        const obj = errors.errors[name]

        if (obj._auto) {
            obj.code = code
            delete obj._auto
        }

        // same with descriptions, telethon uses python-like formatting
        // strings. we'll convert it to printf-like, while also saving parameter
        // names for better code insights
        // we also prefer description from telegram, if it's available and doesn't use placeholders
        if (description) {
            const desc = description.replace(/\{(\w+)\}/g, (_, name: string) => {
                if (!obj._paramNames) {
                    obj._paramNames = []
                }
                obj._paramNames.push(name)

                return '%d'
            })

            if (!obj.description || obj._paramNames?.length) {
                obj.description = desc
            }
        }
    }
}

async function main() {
    const errors: TlErrors = {
        base: baseErrors,
        errors: {},
        throws: {},
        userOnly: {},
        botOnly: {},
    }

    console.log('Fetching errors from Telegram...')
    await fetchFromTelegram(errors)

    // using some incredible fucking crutches we are also able to parse telethon errors file
    // and add missing error descriptions
    console.log('Fetching errors from Telethon...')
    await fetchFromTelethon(errors)

    console.log('Saving...')

    await writeFile(ERRORS_JSON_FILE, JSON.stringify(errors))
}

main().catch(console.error)
