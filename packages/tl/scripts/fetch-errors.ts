import { join } from 'path'
import fetch from 'node-fetch'
import csvParser from 'csv-parser'
import { camelToPascal, snakeToCamel } from '@mtcute/tl-utils/src/codegen/utils'
import { writeFile } from 'fs/promises'

const OUT_TS_FILE = join(__dirname, '../errors.d.ts')
const OUT_JS_FILE = join(__dirname, '../errors.js')

const TELETHON_ERRORS_CSV =
    'https://raw.githubusercontent.com/LonamiWebs/Telethon/master/telethon_generator/data/errors.csv'

interface ErrorInfo {
    base?: true
    virtual?: true
    codes: string
    name: string
    description: string
}

const baseErrors: ErrorInfo[] = [
    {
        codes: '400',
        name: 'BAD_REQUEST',
        description:
            'The query contains errors. In the event that a request was created using a form ' +
            'and contains user generated data, the user should be notified that the data must ' +
            'be corrected before the query is repeated',
    },
    {
        codes: '401',
        name: 'UNAUTHORIZED',
        description:
            'There was an unauthorized attempt to use functionality available only to authorized users.',
    },
    {
        codes: '403',
        name: 'FORBIDDEN',
        description:
            'Privacy violation. For example, an attempt to write a message ' +
            'to someone who has blacklisted the current user.',
    },
    {
        codes: '404',
        name: 'NOT_FOUND',
        description:
            'An attempt to invoke a non-existent object, such as a method.',
    },
    {
        codes: '420',
        name: 'FLOOD',
        description:
            'The maximum allowed number of attempts to invoke the given method' +
            'with the given input parameters has been exceeded. For example, in an' +
            'attempt to request a large number of text messages (SMS) for the same' +
            'phone number.',
    },
    {
        codes: '303',
        name: 'SEE_OTHER',
        description:
            'The request must be repeated, but directed to a different data center',
    },
    {
        codes: '406',
        name: 'NOT_ACCEPTABLE',
        description:
            'Similar to 400 BAD_REQUEST, but the app should not display any error messages to user ' +
            'in UI as a result of this response. The error message will be delivered via ' +
            'updateServiceNotification instead.',
    },
    {
        codes: '500',
        name: 'INTERNAL',
        description:
            'An internal server error occurred while a request was being processed; ' +
            'for example, there was a disruption while accessing a database or file storage.',
    },
]
baseErrors.forEach((it) => (it.base = true))

const virtualErrors: ErrorInfo[] = [
    {
        name: 'RPC_TIMEOUT',
        codes: '408',
        description: 'The set RPC timeout has exceeded',
    },
    {
        name: 'MESSAGE_NOT_FOUND',
        codes: '404',
        description: 'Message was not found',
    },
]
virtualErrors.forEach((it) => (it.virtual = true))

const inheritanceTable: Record<string, string> = {
    400: 'BadRequestError',
    401: 'UnauthorizedError',
    403: 'ForbiddenError',
    404: 'NotFoundError',
    420: 'FloodError',
    303: 'SeeOtherError',
    406: 'NotAcceptableError',
    500: 'InternalError',
}

const RPC_ERROR_CLASS_JS = `
class RpcError extends Error {
    constructor(code, text, description) {
        super(description);
        this.code = code;
        this.text = text;
    }
}
exports.RpcError = RpcError;
`.trimStart()

const RPC_ERROR_CLASS_TS = `
export declare class RpcError extends Error {
    code: number;
    text: string;
    constructor (code: number, text: string, description?: string);
}
`.trimStart()

const BASE_ERROR_TEMPLATE_JS = `
class {className} extends RpcError {
    constructor(name, description) {
        super({code}, name, description);
    }
}
exports.{className} = {className}
`
const BASE_ERROR_TEMPLATE_TS = `
export declare class {className} extends RpcError {
    constructor (name: string, description: string);
}
`

const TL_BUILDER_TEMPLATE_JS = `
exports.createRpcErrorFromTl = function (obj) {
    if (obj.errorMessage in _staticNameErrors) return new _staticNameErrors[obj.errorMessage]();

    let match;
    {parametrized}

   if (obj.errorCode in _baseCodeErrors) return new _baseCodeErrors[obj.errorCode](obj.errorMessage);

    return new RpcError(obj.errorCode, obj.errorMessage);
}
`.trim()

const DESCRIPTION_PARAM_RE = /_X_|_X$|^X_/

function jsComment(s: string): string {
    return (
        '/**' +
        s
            .replace(/(?![^\n]{1,60}$)([^\n]{1,60})\s/g, '$1\n')
            .replace(/\n|^/g, '\n * ') +
        '\n */'
    )
}

async function fetchTelethonErrors(): Promise<ErrorInfo[]> {
    const stream = await fetch(TELETHON_ERRORS_CSV).then((i) => i.body!)

    return new Promise((resolve, reject) => {
        const ret: ErrorInfo[] = []

        stream
            .pipe(csvParser())
            .on('data', (it) => ret.push(it))
            .on('end', () => resolve(ret))
            .on('error', reject)
    })
}

interface ExtendedErrorInfo extends ErrorInfo {
    className: string
    code: string
    inherits: string
    argument: string | null
}

function getExtendedErrorInfo(err: ErrorInfo): ExtendedErrorInfo {
    const [, argument] = err.description.match(/{([a-z_]+)}/i) ?? [, null]

    const ret = err as ExtendedErrorInfo

    let className = err.name
    if (className[0].match(/[0-9]/)) {
        className = '_' + className
    }
    className = className.replace(DESCRIPTION_PARAM_RE, (i) =>
        i === '_X_' ? '_' : ''
    )

    ret.className =
        camelToPascal(snakeToCamel(className.toLowerCase())) + 'Error'
    ret.code = err.codes.split(' ')[0]
    ret.inherits = err.base
        ? 'RpcError'
        : inheritanceTable[ret.code] ?? 'RpcError'
    ret.argument = argument ? snakeToCamel(argument) : null

    return ret
}

async function main() {
    console.log('Fetching errors from Telethon...')

    const errors = [
        ...baseErrors,
        ...(await fetchTelethonErrors()),
        ...virtualErrors,
    ].map(getExtendedErrorInfo)

    console.log('Generating code...')

    let js = RPC_ERROR_CLASS_JS
    let ts = RPC_ERROR_CLASS_TS

    for (const err of errors) {
        // generate error class in js
        if (err.base) {
            js += BASE_ERROR_TEMPLATE_JS.replace(
                /{className}/g,
                err.className
            ).replace(/{code}/g, err.code)
        } else {
            js += `class ${err.className} extends ${err.inherits} {\n`
            js += `    constructor(${err.argument ?? ''}) {\n`

            const description = JSON.stringify(err.description).replace(
                /{([a-z_]+)}/gi,
                (_, $1) => `" + ${snakeToCamel($1)} + "`
            )

            if (err.inherits === 'RpcError') {
                js += `        super(${err.code}, '${err.name}', ${description});\n`
            } else {
                js += `        super('${err.name}', ${description});\n`
            }

            if (err.argument) {
                js += `        this.${err.argument} = ${err.argument};\n`
            }

            js += '    }\n}\n'
            js += `exports.${err.className} = ${err.className};\n`
        }

        // generate error class typings
        if (err.description) {
            ts += jsComment(err.description) + '\n'
        }
        if (err.base) {
            ts += BASE_ERROR_TEMPLATE_TS.replace(/{className}/g, err.className)
        } else {
            ts += `export declare class ${err.className} extends ${err.inherits} {\n`

            if (err.argument) {
                ts += `    ${err.argument}: number;\n`
            }

            ts += `    constructor (${
                err.argument ? err.argument + ': number' : ''
            });\n`
            ts += '}\n'
        }
    }

    ts +=
        'export declare function createRpcErrorFromTl (obj: object): RpcError;\n'

    js += 'const _staticNameErrors = {\n'
    for (const err of errors) {
        if (err.virtual || err.argument) continue
        js += `    '${err.name}': ${err.className},\n`
    }
    js += `    'Timeout': TimeoutError,\n` // because telegram c:
    js += '};\n'

    js += 'const _baseCodeErrors = {\n'
    for (const [code, error] of Object.entries(inheritanceTable)) {
        js += `    ${code}: ${error},\n`
    }
    js += '};\n'

    let builderInner = ''
    for (const err of errors) {
        if (err.virtual || !err.argument) continue

        const regex = err.name.replace(DESCRIPTION_PARAM_RE, (s) =>
            s.replace('X', '(\\d+)')
        )
        builderInner +=
            `if ((match=obj.errorMessage.match(/${regex}/))!=null)` +
            `return new ${err.className}(parseInt(match[1]));\n`
    }
    js += TL_BUILDER_TEMPLATE_JS.replace('{parametrized}', builderInner)

    await writeFile(OUT_JS_FILE, js)
    await writeFile(OUT_TS_FILE, ts)
}

main().catch(console.error)
