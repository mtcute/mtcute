// disclaimer: code sucks because tl itself sucks :shrug:
const { createWriter } = require('./common')

const schema = require('../raw-schema.json')

const output = createWriter('../binary/writer.js')
const { tab, untab, write } = output

write(`// This file is auto-generated. Do not edit.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

function _has (value) { return +!!(Array.isArray(value) ? value.length : value !== undefined); }
function _assert_has (obj, prop) { if (obj[prop] === void 0) throw new Error('Object ' + obj._ + ' is missing required property ' + prop) }

exports.default = {`)
tab()

const parsedManually = [
    0x1cb5c415,
    0x3072cfa1,
    0xbc799737,
    0x997275b5,
    0x3fedd339,
    0x56730bcc,
]

function getFunctionCallByTypeName(ns, type, value = 'obj') {
    let funcName,
        args = [value]
    if (type === 'number') funcName = 'int32'
    else if (type === 'Long') funcName = 'long'
    else if (type === 'RawLong') funcName = 'rawLong'
    else if (type === 'Int128') funcName = 'int128'
    else if (type === 'Int256') funcName = 'int256'
    else if (type === 'Double') funcName = 'double'
    else if (type === 'string') funcName = 'string'
    else if (type === 'Buffer') funcName = 'bytes'
    else if (type.match(/^(boolean|true|false)$/)) funcName = 'boolean'
    else if (type.endsWith('[]')) {
        let typ = type.substr(0, type.length - 2)
        let isBare = false

        let writer //  = `(r, val) => r.${getFunctionCallByTypeName(ns, typ, 'val')}`
        if (typ[0] === '%') {
            typ = typ.substr(1)
            isBare = true
            if (typ !== 'Message')
                throw new Error('Only bare mt_message is supported!')
        }
        if (typ === 'number') writer = 'this.int32'
        else if (typ === 'Buffer') writer = 'this.bytes'
        else if (typ === 'Long') writer = 'this.long'
        else if (typ === 'RawLong') writer = 'this.rawLong'
        else if (typ === 'Int128') writer = 'this.int128'
        else if (typ === 'Int256') writer = 'this.int256'
        else if (typ === 'Double') writer = 'this.double'
        else if (typ === 'string') writer = 'this.string'
        else writer = 'this.object'

        funcName = `vector`
        args = [writer, value]
        if (isBare) args.push(true)
    } else funcName = `object`

    return `${funcName}(${args.join(', ')})`
}

function writeNamespace(nsType) {
    return ([namespace, content]) => {
        let baseTypePrefix = nsType === 'mtproto' ? 'mtproto.' : ''
        let nsPrefix = namespace === '$root' ? '' : namespace + '.'
        let prefix = (nsType === 'mtproto' ? 'mt_' : '') + nsPrefix

        const addObject = (isMethod) => {
            return (cls) => {
                if (cls.id === 0 || parsedManually.includes(cls.id)) return

                let is_mt_message =
                    nsType === 'mtproto' && cls.name === 'message'
                if (cls.arguments && cls.arguments.length) {
                    write(
                        `'${prefix}${cls.name}': function (obj${
                            is_mt_message ? ', bare' : ''
                        }) {`
                    )
                } else {
                    write(`'${prefix}${cls.name}': function () {`)
                }
                tab()
                if (is_mt_message) {
                    write('if (!bare)')
                }
                write(`${is_mt_message ? '    ' : ''}this.uint32(${cls.id})`)

                if (cls.arguments) {
                    cls.arguments.forEach((arg) => {
                        if (arg.type === '$FlagsBitField') {
                            let content = cls.arguments
                                .filter(
                                    (i) =>
                                        i.optional &&
                                        i.predicate.split('.')[0] === arg.name
                                )
                                .map(
                                    (arg) =>
                                        `(${
                                            arg.type === 'true'
                                                ? `+!!obj.${arg.name}`
                                                : `_has(obj.${arg.name})`
                                        } << ${arg.predicate.split('.')[1]})`
                                )
                                .join(' | ')
                            write(`this.uint32(${content})`)
                        } else {
                            if (arg.optional && arg.type === 'true') return // zero-size, included in flags
                            if (arg.optional) {
                                write(`if (_has(obj.${arg.name}))`)
                                tab()
                            } else {
                                write(`_assert_has(obj, '${arg.name}')`)
                            }
                            if (is_mt_message && arg.name === 'body') {
                                write('this.raw(obj.body)')
                            } else {
                                write(
                                    `this.${getFunctionCallByTypeName(
                                        baseTypePrefix,
                                        arg.type,
                                        `obj.${arg.name}`
                                    )}`
                                )
                            }
                            if (arg.optional) {
                                untab()
                            }
                        }
                    })
                }

                untab()
                write('},')
            }
        }

        content.classes.forEach(addObject(false))
        content.methods.forEach(addObject(true))
    }
}

Object.entries(schema.mtproto).forEach(writeNamespace('mtproto'))
Object.entries(schema.api).forEach(writeNamespace())

// for writerMap
untab()
write('}')
