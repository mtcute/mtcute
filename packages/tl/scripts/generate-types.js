// disclaimer: code sucks because tl itself sucks :shrug:
// this file generates TS and JS files simultaneously to prevent re-compilation of TS file
// and to optimize indexing
const { createWriter, camelToPascal } = require('./common')
const schema = require('../raw-schema.json')

let ts = createWriter('../index.d.ts')
let js = createWriter('../index.js')

// language=TypeScript
ts.write(`// This file is auto-generated. Do not edit.
import { BigInteger } from 'big-integer';

/**
 * Classes and methods generated from \`.tl\` files
 *
 * Quick guide:
 *  - types prefixed with Type are unions and aliases (e.g. \`tl.TypeError = tl.RawError\`)
 *  - types prefixed with Raw are TL objects, be it class or method (e.g \`tl.RawError\`)
 *  - types ending with Request are RPC methods (e.g. \`tl.auth.RawSignInRequest\`)
 *  - you can use \`{ _: 'error', ... }\` to create needed types
 *  - to check if something is of some type, check \`_\` property of an object
 *  - to check if something is of some union, use \`isAny*()\` functions
 */
export declare namespace tl {
    /**
     * Currently used TL layer.
     */
    const CURRENT_LAYER = ${schema.apiLayer};

    type Long = BigInteger;
    type RawLong = Buffer;
    type Int128 = Buffer;
    type Int256 = Buffer;
    type Double = number;

    /**
     * Find type in a union by its name
     *
     * @example
     * \`\`\`typescript
     * const object: tl.RawUser
     * // is the same as
     * const object: tl.FindByName<tl.TypeUser, 'user'>
     * // and this (not recommended because performance will suffer)
     * const object: tl.FindByName<tl.TlObject, 'user'>
     *
     * // this example is pretty primitive, but this may be very useful
     * // in more complex use-cases with generics and stuff
     * \`\`\`
     */
    type FindByName<T extends { _: string }, Name extends T['_']> = Extract<T, { _: Name }>

    /**
     * By default, all TL types are immutable.
     *
     * In some cases, though, you might want to mutate it,
     * so you can use this type.
     *
     * @example
     * \`\`\`typescript
     * const obj: tl.Mutable<tl.TypeUser> = user
     * obj.username = 'something'
     * commitChangesToUser(user)
     * \`\`\`
     */
    type Mutable<T> = {
        -readonly [P in keyof T]: T[P]
    }
`)
ts.tab()

// language=JavaScript
js.write(`// This file is auto-generated. Do not edit.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tl = {};
(function(tl) {
    tl.CURRENT_LAYER = ${schema.apiLayer};
`)
js.tab()

const makePascalCaseNotNamespace = (type) => {
    let split = type.split('.')
    let name = split.pop()
    let ns = split

    if (!ns.length) {
        if (name[0].match(/[A-Z]/))
            // this is union/alias
            return 'Type' + name

        return 'Raw' + camelToPascal(name)
    }
    if (name[0].match(/[A-Z]/)) return ns.join('.') + '.Type' + name
    return ns.join('.') + '.Raw' + camelToPascal(name)
}

const writeSingleSchemaEntry = (type) => {
    // to prevent (possible?) collisions between mtproto.tl and api.tl
    const prefix_ = type === 'mtproto' ? 'mt_' : ''
    let baseTypePrefix = type === 'mtproto' ? 'tl.mtproto.' : 'tl.'
    const fullTypeName = (type) => {
        if (type === 'X') return 'any'
        if (type[0] === '%') type = type.substr(1)
        if (prefix_ === 'mt_' && type === 'Object') return 'tl.TlObject'
        if (
            type === 'number' ||
            type === 'any' ||
            type === 'Long' ||
            type === 'RawLong' ||
            type === 'Int128' ||
            type === 'Int256' ||
            type === 'Double' ||
            type === 'string' ||
            type === 'Buffer' ||
            type.match(/^(boolean|true|false)$/)
        )
            return type
        if (type.endsWith('[]')) {
            let wrap = type.substr(0, type.length - 2)
            return fullTypeName(wrap) + '[]'
        }

        return baseTypePrefix + makePascalCaseNotNamespace(type)
    }

    return ([namespace, content]) => {
        let prefix = prefix_ + (namespace === '$root' ? '' : namespace + '.')
        let jsPrefix =
            baseTypePrefix + (namespace === '$root' ? '' : namespace + '.')

        if (namespace !== '$root') {
            ts.write(`\nnamespace ${namespace} {`)
            ts.tab()

            if (content.unions.length) {
                js.write(`${baseTypePrefix}${namespace} = {};`)
                js.write(`(function () {`)
                js.tab()
            }
        }

        const writeObject = (cls) => {
            let comment = ''
            if (cls.description) {
                comment = cls.description
            }
            if (cls.returns) {
                if (comment) comment += '\n\n'
                comment += `RPC call returns {@link ${fullTypeName(
                    cls.returns
                )}}`
            }
            if (comment) ts.comment(comment)

            const capName =
                'Raw' + camelToPascal(cls.name) + (cls.returns ? 'Request' : '')

            ts.write(`interface ${capName} {`)
            ts.tab()
            ts.write(`readonly _: '${prefix}${cls.name}',`)

            if (cls.arguments && cls.arguments.length) {
                cls.arguments.forEach((arg) => {
                    if (arg.type === '$FlagsBitField') return
                    if (arg.type === 'X') arg.type = 'any'
                    if (arg.type === 'true' || arg.type === 'false')
                        arg.type = 'boolean'
                    if (arg.description) ts.comment(arg.description)

                    ts.write(
                        `readonly ${arg.name}${
                            arg.optional ||
                            (arg.name === 'randomId' && arg.type === 'Long')
                                ? '?'
                                : ''
                        }: ${fullTypeName(arg.type)};`
                    )
                })
            }

            ts.untab()
            ts.write('}')
        }

        ts.write('// classes')
        content.classes.forEach(writeObject)

        ts.write('// methods')
        content.methods.forEach(writeObject)

        if (namespace !== '$root') {
            ts.write('interface RpcCallReturn {')
        } else {
            let otherNamespaces = Object.keys(schema[type]).filter(
                (i) => i !== namespace
            )
            if (type === 'api') otherNamespaces.unshift('mtproto')
            if (otherNamespaces.length)
                ts.write(
                    `interface RpcCallReturn extends ${otherNamespaces
                        .map((i) => `${i}.RpcCallReturn`)
                        .join(', ')} {`
                )
            else ts.write('interface RpcCallReturn {')
        }
        ts.tab()
        content.methods.forEach((cls) => {
            ts.write(`'${prefix}${cls.name}': ${fullTypeName(cls.returns)}`)
        })
        ts.untab()
        ts.write('}')

        ts.write('// unions and aliases')
        content.unions.forEach((union) => {
            if (union.description) ts.comment(union.description)
            ts.write(
                `type Type${union.type} = ${union.subtypes
                    .map(makePascalCaseNotNamespace)
                    .join(' | ')}`
            )
            ts.write(
                `function isAny${union.type} (obj: object): obj is Type${union.type};`
            )
            js.write(`${jsPrefix}isAny${camelToPascal(
                union.type
            )} = function (obj) {
    return ${union.subtypes
        .map((typ) => `obj._ === '${prefix_}${typ}'`)
        .join(' || ')};
};`)
        })

        if (namespace !== '$root') {
            ts.untab()
            ts.write('}')

            if (content.unions.length) {
                js.untab()
                js.write(`})();`)
            }
        }
    }
}

// mtproto
ts.write('namespace mtproto {')
ts.tab()
js.write('tl.mtproto = {};\n(function () {')
js.tab()

Object.entries(schema.mtproto).forEach(writeSingleSchemaEntry('mtproto'))

// } for namespace mtproto
ts.untab()
ts.write('}\n')
js.untab()
js.write('})();')

// api
Object.entries(schema.api).forEach(writeSingleSchemaEntry('api'))

const writeEnumMembers = (sch, prefix = '', methods = true, objects = true) =>
    Object.entries(sch)
        .map(([ns, content]) => {
            let items = []
            if (methods) items = content.methods
            if (objects) items = [...items, ...content.classes]
            return items
                .filter((it) => !!it.name)
                .map(
                    (it) =>
                        `\n${ts.indent}| tl.${prefix}${
                            ns === '$root' ? '' : ns + '.'
                        }Raw${camelToPascal(it.name)}${
                            it.returns ? 'Request' : ''
                        }`
                )
                .join('')
        })
        .join('')

// enum unions
ts.write(
    '// all available RPC methods\n' +
        'type RpcMethod = ' +
        writeEnumMembers(schema.mtproto, 'mtproto.', true, false) +
        writeEnumMembers(schema.api, '', true, false)
)
ts.write(
    '// all available TL objects\n' +
        'type TlObject = ' +
        writeEnumMembers(schema.mtproto, 'mtproto.') +
        writeEnumMembers(schema.api)
)
// } for namespace tl
ts.untab()
ts.write('}')
js.untab()
js.write('})(exports.tl);')
