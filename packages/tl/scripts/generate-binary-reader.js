// disclaimer: code sucks because tl itself sucks :shrug:
const { createWriter } = require('./common')
const schema = require('../raw-schema.json')

const output = createWriter('../binary/reader.js')
const { tab, untab, write } = output

write(`// This file is auto-generated. Do not edit.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

exports.default = {`)
tab()

function getFunctionCallByTypeName(ns, type, arg) {
    let funcName,
        args = []
    if (type === 'Object') return 'object()'
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

        let reader //  = `(r, val) => r.${getFunctionCallByTypeName(ns, typ, 'val')}`
        if (typ === '%Message') {
            reader = 'exports.default[1538843921]' // because tl sucks :shrug:
        } else if (typ[0] === '%')
            throw new Error(
                'Only bare mt_message is supported. Please update codegen for ' +
                    typ
            )
        else if (typ === 'number') reader = 'this.int32'
        else if (typ === 'Buffer') reader = 'this.bytes'
        else if (typ === 'Long') reader = 'this.long'
        else if (typ === 'RawLong') reader = 'this.rawLong'
        else if (typ === 'Int128') reader = 'this.int128'
        else if (typ === 'Int256') reader = 'this.int256'
        else if (typ === 'Double') reader = 'this.double'
        else if (typ === 'string') reader = 'this.string'
        else reader = 'this.object'

        if (arg && arg.name === 'serverPublicKeyFingerprints')
            reader = 'this.ulong'

        funcName = `vector`
        args = [reader]

        if (typ === '%Message') args.push(true)
    } else funcName = `object`

    return `${funcName}(${args.join(', ')})`
}

const parsedManually = [
    0x1cb5c415,
    0x3072cfa1,
    0xbc799737,
    0x997275b5,
    0x3fedd339,
    0x56730bcc,
]

function writeNamespace(nsType) {
    return ([namespace, content]) => {
        let baseTypePrefix = nsType === 'mtproto' ? 'mtproto.' : ''
        let nsPrefix = namespace === '$root' ? '' : namespace + '.'
        let prefix = (nsType === 'mtproto' ? 'mt_' : '') + nsPrefix

        const addObject = (isMethod) => {
            return (cls) => {
                if (cls.id === 0 || parsedManually.includes(cls.id)) return

                write(`${cls.id}: function () {`)
                tab()

                let is_mt_message =
                    nsType === 'mtproto' && cls.name === 'message'

                if (cls.arguments?.length) {
                    write(`var ret = {};`)
                    write(`ret._ = '${prefix}${cls.name}';`)

                    cls.arguments.forEach((arg) => {
                        if (arg.type === '$FlagsBitField') {
                            write('var ' + arg.name + ' = this.uint32();')
                        } else if (arg.optional) {
                            let bitIndex = +arg.predicate.split('.')[1]
                            let condition = `${arg.predicate.split('.')[0]} & ${
                                2 ** bitIndex
                            }`

                            if (arg.type === 'true') {
                                write(`ret.${arg.name} = !!(${condition});`)
                            } else {
                                write(
                                    `if (${condition}) ret.${
                                        arg.name
                                    } = this.${getFunctionCallByTypeName(
                                        baseTypePrefix,
                                        arg.type
                                    )}`
                                )
                            }
                        } else {
                            if (is_mt_message && arg.name === 'body') {
                                write('ret.body = this.raw(ret.bytes)')
                            } else {
                                write(
                                    `ret.${
                                        arg.name
                                    } = this.${getFunctionCallByTypeName(
                                        baseTypePrefix,
                                        arg.type,
                                        arg
                                    )};`
                                )
                            }
                        }
                    })

                    write('return ret;')
                } else {
                    write(`return { _: '${prefix}${cls.name}' };`)
                }

                untab()
                write('},')
            }
        }

        content.classes.forEach(addObject(false))
        // we don't really need to read methods :shrug:
        // content.methods.forEach(addObject(true))
    }
}

Object.entries(schema.mtproto).forEach(writeNamespace('mtproto'))
Object.entries(schema.api).forEach(writeNamespace())

// for readerMap
untab()
write('};')
