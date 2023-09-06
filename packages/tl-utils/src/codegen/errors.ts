import { TlErrors } from '../types'
import { snakeToCamel } from './utils'

const TEMPLATE_JS = `
const _descriptionsMap = {
{descriptionsMap}
}
class RpcError extends Error {
    constructor(code, name) {
        super(_descriptionsMap[name] || 'Unknown RPC error: [' + code + ':' + name + ']');
        this.code = code;
        this.name = name;
    }

    static is(err, name) { return err.constructor === RpcError && (!name || err.name === name); }
    is(name) { return this.name === name; }
}
RpcError.fromTl = function (obj) {
    const err = new RpcError(obj.errorCode, obj.errorMessage);

    if (err in _descriptionsMap) return err;

    let match;
{matchers}

    return err
}
{statics}
{exports}RpcError = RpcError;
`.trimStart()

const TEMPLATE_TS = `
type MtErrorText =
{texts}
    | (string & {}) // to keep hints

interface MtErrorArgMap {
{argMap}
}

type RpcErrorWithArgs<T extends string> =
    RpcError & { text: T } & (T extends keyof MtErrorArgMap ? (RpcError & MtErrorArgMap[T]) : {});

export class RpcError extends Error {
{statics}

    readonly code: number;
    readonly text: MtErrorText;
    constructor(code: number, text: MtErrorText);

    is<const T extends MtErrorText>(text: T): this is RpcErrorWithArgs<T>;
    static is<const T extends MtErrorText>(err: unknown): err is RpcError;
    static is<const T extends MtErrorText>(err: unknown, text: T): err is RpcErrorWithArgs<T>;
    static create<const T extends MtErrorText>(code: number, text: T): RpcErrorWithArgs<T>;
    static fromTl(obj: object): RpcError;
}
`.trimStart()

const template = (
    str: string,
    params: Record<string, string | number>,
): string => {
    return str.replace(/{([a-z]+)}/gi, (_, name) => String(params[name] ?? ''))
}

function parseCode(err: string, placeholders_?: string[]): [string, string[]] {
    let addPlaceholders = false

    if (!placeholders_) {
        placeholders_ = []
        addPlaceholders = true
    } else {
        placeholders_ = placeholders_.map(snakeToCamel)
    }

    const placeholders = placeholders_

    err = err.replace(/%[a-z]/g, (placeholder) => {
        if (placeholder !== '%d') {
            throw new Error(`Unsupported placeholder: ${placeholder}`)
        }

        if (addPlaceholders) {
            const idx = placeholders.length
            placeholders.push(`duration${idx === 0 ? '' : idx}`)
        }

        return placeholder
    })

    return [err, placeholders]
}

function placeholderType(_name: string): string {
    // if (!name.startsWith('duration')) {
    //     throw new Error('Invalid placeholder name')
    // }
    return 'number'
}

/**
 * Generate code for given TL errors
 *
 * @param errors  Errors to generate code for
 * @param exports  Prefix for exports object
 * @returns  Tuple containing `[ts, js]` code
 */
export function generateCodeForErrors(
    errors: TlErrors,
    exports = 'exports.',
): [string, string] {
    let descriptionsMap = ''
    let texts = ''
    let argMap = ''
    let matchers = ''
    let staticsJs = ''
    let staticsTs = ''

    for (const [name, code] of Object.entries(errors.base)) {
        staticsJs += `RpcError.${name} = ${code};\n`
        staticsTs += `    static ${name} = ${code};\n`
    }

    for (const error of Object.values(errors.errors)) {
        const [name, placeholders] = parseCode(error.name, error._paramNames)

        if (error.description) {
            descriptionsMap += `    '${name}': ${JSON.stringify(
                error.description,
            )},\n`
        }

        texts += `    | '${name}'\n`

        if (placeholders.length) {
            const placeholderTypes = placeholders.map(placeholderType)
            argMap +=
                `    '${name}': { ` +
                placeholders
                    .map((it, i) => `${it}: ${placeholderTypes[i]}`)
                    .join(', ') +
                ' },\n'

            const regex = name.replace('%d', '(\\d+)')
            const setters = placeholders.map(
                (it, i) => `err.${it} = parseInt(match[${i + 1}])`,
            )
            const settersStr =
                setters.length > 1 ? `{ ${setters.join('; ')} }` : setters[0]
            matchers += `    if ((match=obj.errorMessage.match(/^${regex}$/))!=null)${settersStr}\n`
        }
    }

    return [
        template(TEMPLATE_TS, { statics: staticsTs, texts, argMap }),
        template(TEMPLATE_JS, {
            exports,
            statics: staticsJs,
            descriptionsMap,
            matchers,
        }),
    ]
}
