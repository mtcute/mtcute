import { camelToPascal, jsComment, snakeToCamel } from './utils'
import { TlError, TlErrors } from '../types'

export function errorCodeToClassName(code: string): string {
    let str =
        camelToPascal(
            snakeToCamel(
                code
                    .toLowerCase()
                    .replace(/ /g, '_')
            )
        ) + 'Error'
    if (str[0].match(/\d/)) {
        str = '_' + str
    }
    return str
}

const RPC_ERROR_CLASS_JS = `
class RpcError extends Error {
    constructor(code, text, description) {
        super(description);
        this.code = code;
        this.text = text;
    }
}
{exports}RpcError = RpcError;
`.trimStart()

const RPC_ERROR_CLASS_TS = `
export class RpcError extends Error {
    readonly code: number;
    readonly text: string;
    constructor(code: number, text: string, description?: string);
}
`.trimStart()

const BASE_ERROR_JS = `
class {className} extends RpcError {
    constructor(name, description) {
        super({code}, name, description);
    }
}
{exports}{className} = {className}
`
const BASE_ERROR_TS = `
export class {className} extends RpcError {
    constructor(name: string, description: string);
}
`.trimStart()

const ERROR_PRELUDE = `{ts}class {className} extends {base} {
    constructor({arguments})`

const TL_BUILDER_TEMPLATE_JS = `
{exports}createRpcErrorFromTl = function (obj) {
    if (obj.errorMessage in _byName) return new _byName[obj.errorMessage]();

    let match;
    {inner}

    if (obj.errorCode in _byCode) return new _byCode[obj.errorCode](obj.errorMessage);

    return new RpcError(obj.errorCode, obj.errorMessage);
}
`.trim()

const template = (str: string, params: Record<string, any>): string => {
    return str.replace(/{([a-z]+)}/gi, (_, name) => params[name] ?? '')
}

function parseCode(
    err: string,
    placeholders?: string[]
): [string, string[], boolean] {
    let addPlaceholders = false

    if (!placeholders) {
        placeholders = []
        addPlaceholders = true
    }

    let wildcard = false

    err = err
        .replace(/%[a-z]/g, (ph) => {
            if (ph !== '%d') {
                throw new Error(`Unsupported placeholder: ${ph}`)
            }

            if (addPlaceholders) {
                const idx = placeholders!.length
                placeholders!.push(`duration${idx === 0 ? '' : idx}`)
            }

            return 'X'
        })
        .replace(/_\*$/, () => {
            wildcard = true
            return ''
        })

    return [err, placeholders, wildcard]
}

function placeholderType(name: string): string {
    // if (!name.startsWith('duration')) {
    //     throw new Error('Invalid placeholder name')
    // }
    return 'number'
}

export function generateCodeForErrors(
    errors: TlErrors,
    exports = 'exports.'
): [string, string] {
    let ts = RPC_ERROR_CLASS_TS
    let js = template(RPC_ERROR_CLASS_JS, { exports })

    const baseErrorsClasses: Record<number, string> = {}

    for (const it of errors.base) {
        const className = errorCodeToClassName(it.name)
        baseErrorsClasses[it.code] = className

        if (it.description) ts += jsComment(it.description) + '\n'
        ts +=
            template(BASE_ERROR_TS, {
                className,
            }) + '\n'
        js += template(BASE_ERROR_JS, {
            className,
            code: it.code,
            exports,
        })
    }

    const errorClasses: Record<string, string> = {}
    const wildcardClasses: [string, string][] = []
    const withPlaceholders: [string, string][] = []

    function findBaseClass(it: TlError) {
        for (const [prefix, cls] of wildcardClasses) {
            if (it.name.startsWith(prefix)) return cls
        }

        return baseErrorsClasses[it.code] ?? 'RpcError'
    }

    for (const it of Object.values(errors.errors)) {
        if (it._auto) {
            // information about the error is incomplete
            continue
        }

        const [name, placeholders, wildcard] = parseCode(
            it.name,
            it._paramNames
        )

        const className = errorCodeToClassName(name)
        const baseClass = findBaseClass(it)

        if (!it.virtual && !wildcard) {
            errorClasses[it.name] = className
        }
        if (wildcard) {
            wildcardClasses.push([it.name.replace('*', ''), className])
        }
        if (placeholders.length) {
            withPlaceholders.push([it.name, className])
        }

        js +=
            template(ERROR_PRELUDE, {
                className,
                base: baseClass,
                arguments: wildcard
                    ? 'code, description'
                    : placeholders.join(', '),
            }) + '{\n'

        let description
        let comment = ''
        if (it.description) {
            let idx = 0
            description = JSON.stringify(it.description).replace(
                /%[a-z]/g,
                () => `" + ${placeholders[idx++]} + "`
            )

            if (wildcard) {
                description = description.replace(/"$/, ': " + description')
            }

            idx = 0
            comment += it.description.replace(
                /%[a-z]/g,
                () => `{@see ${placeholders[idx++]}}`
            )
        } else {
            description = `"Unknown RPC error: [${it.code}:${it.name}]"`
        }

        if (it.virtual) {
            if (comment) comment += '\n\n'
            comment +=
                'This is a *virtual* error, meaning that it may only occur when using MTCute APIs (not MTProto)'
        }

        if (wildcard) {
            if (comment) comment += '\n\n'
            comment +=
                'This is an *abstract* error, meaning that only its subclasses may occur when using the API'
        }

        if (comment) ts += jsComment(comment) + '\n'
        ts +=
            template(ERROR_PRELUDE, {
                ts: 'export ',
                className,
                base: baseClass,
                arguments: placeholders
                    .map((it) => `${it}: ${placeholderType(it)}`)
                    .join(', '),
            }) + ';'

        if (baseClass === 'RpcError') {
            js += `super(${it.code}, '${it.name}', ${description});`
        } else if (wildcard) {
            js += `super(code, ${description});`
        } else {
            js += `super('${it.name}', ${description});`
        }

        for (const ph of placeholders) {
            js += `\nthis.${ph} = ${ph};`
            ts += `\n    readonly ${ph}: ${placeholderType(ph)}`
        }

        js += '\n    }\n}\n'
        js += `${exports}${className} = ${className};\n`

        ts += '\n}\n'
    }

    ts += 'export function createRpcErrorFromTl (obj: object): RpcError;\n'

    // and now we need to implement it
    js += 'const _byName = {\n'
    for (const [name, cls] of Object.entries(errorClasses)) {
        js += `'${name.replace(/%[a-z]/gi, 'X')}': ${cls},\n`
    }
    js += '};\n'

    js += 'const _byCode = {\n'
    for (const [code, cls] of Object.entries(baseErrorsClasses)) {
        js += `${code}: ${cls},\n`
    }
    js += '};\n'

    // finally, the function itself

    let inner = ''

    for (const [name, cls] of withPlaceholders) {
        const regex = name.replace('%d', '(\\d+)')
        inner += `if ((match=obj.errorMessage.match(/^${regex}$/))!=null)return new ${cls}(parseInt(match[1]));\n`
    }

    js += template(TL_BUILDER_TEMPLATE_JS, { inner, exports })

    return [ts, js]
}
