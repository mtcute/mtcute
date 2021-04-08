const { createWriter, snakeToCamel, camelToPascal } = require('./common')
const fetch = require('node-fetch')
const csvParser = require('csv-parser')

const ts = createWriter('../errors.d.ts')
const js = createWriter('../errors.js')

const baseErrors = [
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

const inheritanceTable = {
    400: 'BadRequestError',
    401: 'UnauthorizedError',
    403: 'ForbiddenError',
    404: 'NotFoundError',
    420: 'FloodError',
    303: 'SeeOtherError',
    406: 'NotAcceptableError',
    500: 'InternalError',
}

async function main() {
    // relying on slightly more exhaustive than official docs errors.csv from telethon
    const csvText = await fetch(
        'https://raw.githubusercontent.com/LonamiWebs/Telethon/master/telethon_generator/data/errors.csv'
    ).then((i) => i.body)

    const csv = await new Promise((resolve, reject) => {
        const ret = []
        csvText
            .pipe(csvParser())
            .on('data', (it) => ret.push(it))
            .on('end', () => resolve(ret))
            .on('error', reject)
    })

    js.write(`// This file was auto-generated. Do not edit!
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RpcError extends Error {
    constructor(code, text, description) {
        super(description);
        this.code = code;
        this.text = text;
    }
}
exports.RpcError = RpcError;`)
    ts.write(`// This file was auto-generated. Do not edit!
export declare class RpcError extends Error {
    code: number;
    text: string;
    constructor (code: number, text: string, description?: string);
}`)
    baseErrors.forEach((it) => (it.base = true))
    const allErrors = [...baseErrors, ...csv]
    allErrors.forEach((err) => {
        let hasArgument =
            err.description && err.description.match(/{([a-z_]+)}/i)
        let argName = hasArgument ? snakeToCamel(hasArgument[1]) : ''
        if (err.name[0].match(/[0-9]/)) err.clsname = '_' + err.name
        else err.clsname = err.name
        err.clsname = err.clsname.replace(/_X_|_X$|^X_/, (i) =>
            i === '_X_' ? '_' : ''
        )
        const className =
            camelToPascal(snakeToCamel(err.clsname.toLowerCase())) + 'Error'
        err.fclsname = className

        const descrCode = JSON.stringify(err.description).replace(
            /{([a-z_]+)}/gi,
            (_, $1) => `" + ${snakeToCamel($1)} + "`
        )
        err.code = err.codes.split(' ')[0]
        err.inherits = err.base
            ? 'RpcError'
            : inheritanceTable[err.code] || 'RpcError'
        if (err.base) {
            js.write(`class ${className} extends RpcError {
    constructor(name, description) {
        super(${err.code}, name, description);
    }
}
exports.${className} = ${className}`)
        } else {
            js.write(`class ${className} extends ${err.inherits} {
    constructor(${argName}) {
        super(${err.inherits === 'RpcError' ? `${err.code}, ` : ''}'${
                err.name
            }', ${descrCode});${
                hasArgument
                    ? `
        this.${argName} = ${argName};`
                    : ''
            }
    }
}
exports.${className} = ${className}`)
        }
        ts.comment(err.description)
        if (err.base) {
            ts.write(`export declare class ${className} extends RpcError {
    constructor (name: string, description: string);
}`)
        } else {
            ts.write(`export declare class ${className} extends ${
                err.inherits
            } {${
                hasArgument
                    ? `
    ${argName}: number;`
                    : ''
            }
    constructor (${hasArgument ? argName + ': number' : ''});
}`)
        }
    })

    ts.write(
        'export declare function createRpcErrorFromTl (obj: any): RpcError;'
    )

    js.write('const _staticNameErrors = {')
    js.tab()
    csv.filter((i) => !i.name.match(/_X_|_X$|^X_/)).forEach((err) =>
        js.write(`'${err.name}': ${err.fclsname},`)
    )
    js.write(`'Timeout': TimeoutError,`)
    js.untab()
    js.write('};')
    js.write(`exports.createRpcErrorFromTl = function (obj) {
    if (obj.errorMessage in _staticNameErrors) return new _staticNameErrors[obj.errorMessage]();

    let match;
${allErrors
    .filter((i) => !!i.name.match(/_X_|_X$|^X_/))
    .map(
        (i) =>
            `    if ((match = obj.errorMessage.match(/${i.name.replace(
                /_X_|_X$|^X_/g,
                (i) => i.replace('X', '(\\d+)')
            )}/)) != null) return new ${i.fclsname}(parseInt(match[1]));`
    )
    .join('\n')}

    return new RpcError(obj.errorCode, obj.errorMessage);
}`)
}

main().catch(console.error)
