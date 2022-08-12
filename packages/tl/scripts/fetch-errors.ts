import { TlError, TlErrors } from '@mtcute/tl-utils'
import fetch from 'node-fetch'
// @ts-ignore
import csvParser from 'csv-parser'
import { writeFile } from 'fs/promises'
import { ERRORS_JSON_FILE } from './constants'

const ERRORS_PAGE_TG = 'https://corefork.telegram.org/api/errors'
const ERRORS_PAGE_TELETHON =
    'https://raw.githubusercontent.com/LonamiWebs/Telethon/master/telethon_generator/data/errors.csv'

const baseErrors: TlError[] = [
    {
        code: 400,
        name: 'BAD_REQUEST',
        description:
            'The query contains errors. In the event that a request was created using a form ' +
            'and contains user generated data, the user should be notified that the data must ' +
            'be corrected before the query is repeated',
    },
    {
        code: 401,
        name: 'UNAUTHORIZED',
        description:
            'There was an unauthorized attempt to use functionality available only to authorized users.',
    },
    {
        code: 403,
        name: 'FORBIDDEN',
        description:
            'Privacy violation. For example, an attempt to write a message ' +
            'to someone who has blacklisted the current user.',
    },
    {
        code: 404,
        name: 'NOT_FOUND',
        description:
            'An attempt to invoke a non-existent object, such as a method.',
    },
    {
        code: 420,
        name: 'FLOOD',
        description:
            'The maximum allowed number of attempts to invoke the given method' +
            'with the given input parameters has been exceeded. For example, in an' +
            'attempt to request a large number of text messages (SMS) for the same' +
            'phone number.',
    },
    {
        code: 303,
        name: 'SEE_OTHER',
        description:
            'The request must be repeated, but directed to a different data center',
    },
    {
        code: 406,
        name: 'NOT_ACCEPTABLE',
        description:
            'Similar to 400 BAD_REQUEST, but the app should not display any error messages to user ' +
            'in UI as a result of this response. The error message will be delivered via ' +
            'updateServiceNotification instead.',
    },
    {
        code: 500,
        name: 'INTERNAL',
        description:
            'An internal server error occurred while a request was being processed; ' +
            'for example, there was a disruption while accessing a database or file storage.',
    },
]

const virtualErrors: TlError[] = [
    {
        name: 'RPC_TIMEOUT',
        code: 408,
        description: 'The set RPC timeout has exceeded',
    },
    {
        name: 'MESSAGE_NOT_FOUND',
        code: 404,
        description: 'Message was not found',
    },
]
virtualErrors.forEach((it) => (it.virtual = true))

async function fetchFromTelegram(errors: TlErrors) {
    const page = await fetch(ERRORS_PAGE_TG).then((it) => it.text())
    const jsonUrl = page.match(
        /can be found <a href="([^"]+)">here »<\/a>/i
    )![1]

    const json = await fetch(new URL(jsonUrl, ERRORS_PAGE_TG)).then((it) =>
        it.json()
    )

    // since nobody fucking guarantees that .descriptions
    // will have description for each described here (or vice versa),
    // we will process them independently

    for (const code of Object.keys(json.errors)) {
        for (const name of Object.keys(json.errors[code])) {
            const thrownBy = json.errors[code][name]

            const _code = parseInt(code)
            if (isNaN(_code)) {
                throw new Error(`Invalid code: ${code}`)
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

                if (errors.throws[method].indexOf(name) === -1) {
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
}

async function fetchFromTelethon(errors: TlErrors) {
    const csv = await fetch(ERRORS_PAGE_TELETHON)
    const parser = csvParser()

    function addError(name: string, codes: string, description: string): void {
        if (!codes) return
        if (name === 'TIMEOUT') return

        const code = parseInt(codes)
        if (isNaN(code)) {
            throw new Error(`Invalid code: ${codes} (name: ${name})`)
        }

        // telethon uses numbers for parameters instead of printf-like
        // we'll convert it back to printf-like
        // so far, only one param is supported
        name = name.replace(/_0(_)?/g, '_%d$1')

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
            const desc = description.replace(/{([a-z0-9_]+)}/gi, (_, name) => {
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

    return new Promise<void>((resolve, reject) => {
        csv.body
            .pipe(parser)
            .on('data', ({ name, codes, description }) =>
                addError(name, codes, description)
            )
            .on('end', resolve)
            .on('error', reject)
    })
}

async function main() {
    const errors: TlErrors = {
        base: baseErrors,
        errors: {},
        throws: {},
        userOnly: {},
    }

    console.log('Fetching errors from Telegram...')
    await fetchFromTelegram(errors)

    // using some incredible fucking crutches we are also able to parse telethon errors file
    // and add missing error descriptions
    console.log('Fetching errors from Telethon...')
    await fetchFromTelethon(errors)

    virtualErrors.forEach((err) => {
        if (errors.errors[err.name]) {
            console.log(`Error ${err.name} already exists and is not virtual`)
            return
        }

        errors.errors[err.name] = err
    })

    console.log('Saving...')

    await writeFile(ERRORS_JSON_FILE, JSON.stringify(errors))
}

main().catch(console.error)
