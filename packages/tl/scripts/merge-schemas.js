// used by generate-schema, but since logic is quite large, moved it to a separate file
const CRC32 = require('crc-32')

const signedInt32ToUnsigned = (val) => (val < 0 ? val + 0x100000000 : val)

// converting map from custom type back to tl
const _types = {
    number: 'int',
    Long: 'long',
    Int128: 'int128',
    Int256: 'int256',
    Double: 'double',
    string: 'string',
    Buffer: 'bytes',
    false: 'boolFalse',
    true: 'boolTrue',
    boolean: 'bool',
    boolean: 'Bool',
    true: 'true',
    null: 'null',
    any: 'Type',
    $FlagsBitField: '#',
}

function convertType(typ) {
    if (typ in _types) return _types[typ]
    let m = typ.match(/^(.+?)\[\]$/)
    if (m) {
        return 'Vector ' + convertType(m[1])
    }
    return typ
}

function stringifyType(cls, ns = cls._ns, includeId = true) {
    let str = ''

    if (ns !== '$root') {
        str += ns + '.'
    }

    str += cls.name

    if (includeId && cls.id) {
        str += '#' + cls.id.toString(16)
    }

    str += ' '

    if (cls.generics) {
        for (const g of cls.generics) {
            str += g.name + ':' + convertType(g.super) + ' '
        }
    }

    for (const arg of cls.arguments) {
        if (arg.optional && arg.type === 'true') continue

        str += arg.name + ':'

        if (arg.optional) {
            str += arg.predicate + '?'
        }

        if (arg.type === 'X') {
            str += '!'
        }

        str += convertType(arg.type) + ' '
    }

    str += '= ' + convertType(cls.type || cls.returns)

    return str
}

function computeConstructorId(ns, cls) {
    return signedInt32ToUnsigned(CRC32.str(stringifyType(cls, ns, false)))
}

function createTlSchemaIndex(schema) {
    let ret = {}
    Object.entries(schema).forEach(([ns, it]) => {
        it.classes.forEach((obj) => {
            obj.uid = 'c_' + ns + '.' + obj.name
            obj._ns = ns
            obj._type = 'classes'
            ret[obj.uid] = obj
        })
        it.methods.forEach((obj) => {
            obj.uid = 'm_' + ns + '.' + obj.name
            obj._ns = ns
            obj._type = 'methods'
            ret[obj.uid] = obj
        })
        it.unions.forEach((obj) => {
            obj.uid = 'u_' + ns + '.' + obj.type
            obj._ns = ns
            obj._type = 'unions'
            ret[obj.uid] = obj
        })
    })
    return ret
}

// merge schema `b` into `a` (does not copy)
async function mergeSchemas(a, b) {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    const input = (q) => new Promise((res) => rl.question(q, res))

    const index = createTlSchemaIndex(a)
    const indexB = createTlSchemaIndex(b)

    for (const [uid, objB] of Object.entries(indexB)) {
        if (!(uid in index)) {
            // just add
            index[uid] = objB

            if (!a[objB._ns])
                a[objB._ns] = {
                    classes: [],
                    methods: [],
                    unions: [],
                }

            if (!a[objB._ns][objB._type]) a[objB._ns][objB._type] = []

            a[objB._ns][objB._type].push(objB)
            continue
        }

        const objA = index[uid]

        if (objB._type === 'unions') {
            // merge subclasses
            objA.subtypes = [...new Set([...objA.subtypes, ...objB.subtypes])]
            continue
        }

        // check for conflict
        if (objA.id !== objB.id) {
            console.log('! CONFLICT !')
            console.log('Schema A (tdlib): %s', stringifyType(objA))
            console.log('Schema B (tdesktop): %s', stringifyType(objB))

            let keep
            while (true) {
                keep = await input('Which to keep? [A/B] > ')
                keep = keep.toUpperCase()

                if (keep !== 'A' && keep !== 'B') {
                    console.log('Invalid input! Please type A or B')
                    continue
                }

                break
            }

            if (keep === 'B') {
                index[objB.uid] = objB

                const idx = a[objB._ns][objB._type].findIndex((it) => it.uid === objB.uid)
                a[objB._ns][objB._type][idx] = objB
            }

            continue
        }

        // now ctor id is the same, meaning that only `true` flags may differ.
        // merge them.

        const argsIndex = {}

        objA.arguments.forEach((arg) => {
            argsIndex[arg.name] = arg
        })

        objB.arguments.forEach((arg) => {
            if (!(arg.name in argsIndex)) {
                objA.arguments.push(arg)
            }
        })
    }

    // clean up
    Object.values(index).forEach((obj) => {
        delete obj.uid
        delete obj._ns
        delete obj._type
    })

    rl.close()
}

module.exports = { mergeSchemas }

if (require.main === module) {
    const { expect } = require('chai')
    const schema = require('../raw-schema.json')

    console.log('testing ctor id computation')
    Object.entries(schema.api, (ns, items) => {
        for (const obj of items.methods) {
            if (obj.id !== computeConstructorId(ns, obj)) {
                console.log('invalid ctor id: %s', obj.name)
            }
        }
        for (const obj of items.classes) {
            if (obj.id !== computeConstructorId(ns, obj)) {
                console.log('invalid ctor id: %s', obj.name)
            }
        }
    })


    async function test() {
        function makeNamespace (obj = {}) {
            return {
                classes: [],
                methods: [],
                unions: [],
                ...obj
            }
        }

        async function testMergeSchemas (name, a, b, expected) {
            await mergeSchemas(a, b)

            expect(a).eql(expected, name)
        }

        console.log('testing merging')

        await testMergeSchemas('new type', {
            test: makeNamespace()
        }, {
            test: makeNamespace({
                methods: [
                    {
                        name: 'useError',
                        returns: 'Error',
                        arguments: []
                    }
                ]
            })
        }, {
            test: makeNamespace({
                methods: [
                    {
                        name: 'useError',
                        returns: 'Error',
                        arguments: []
                    }
                ]
            })
        })

        await testMergeSchemas('different union', {
            help: makeNamespace({
                unions: [
                    {
                        type: 'ConfigSimple',
                        subtypes: [
                            'testA',
                            'testB'
                        ]
                    }
                ]
            })
        }, {
            help: makeNamespace({
                unions: [
                    {
                        type: 'ConfigSimple',
                        subtypes: [
                            'testB',
                            'testC'
                        ]
                    }
                ]
            })
        }, {
            help: makeNamespace({
                unions: [
                    {
                        type: 'ConfigSimple',
                        subtypes: [
                            'testA',
                            'testB',
                            'testC'
                        ]
                    }
                ]
            })
        })

        await testMergeSchemas('different class', {
            help: makeNamespace({
                classes: [
                    {
                        name: 'configSimple',
                        type: 'ConfigSimple',
                        arguments: [
                            {
                                name: 'flags',
                                type: '$FlagsBitField'
                            },
                            {
                                name: 'date',
                                type: 'number'
                            },
                            {
                                name: 'includeThis',
                                optional: true,
                                predicate: 'flags.0',
                                type: 'true'
                            }
                        ]
                    }
                ]
            })
        }, {
            help: makeNamespace({
                classes: [
                    {
                        name: 'configSimple',
                        type: 'ConfigSimple',
                        arguments: [
                            {
                                name: 'flags',
                                type: '$FlagsBitField'
                            },
                            {
                                name: 'date',
                                type: 'number'
                            },
                            {
                                name: 'includeThat',
                                optional: true,
                                predicate: 'flags.0',
                                type: 'true'
                            }
                        ]
                    }
                ]
            })
        }, {
            help: makeNamespace({
                classes: [
                    {
                        name: 'configSimple',
                        type: 'ConfigSimple',
                        arguments: [
                            {
                                name: 'flags',
                                type: '$FlagsBitField'
                            },
                            {
                                name: 'date',
                                type: 'number'
                            },
                            {
                                name: 'includeThis',
                                optional: true,
                                predicate: 'flags.0',
                                type: 'true'
                            },
                            {
                                name: 'includeThat',
                                optional: true,
                                predicate: 'flags.0',
                                type: 'true'
                            }
                        ]
                    }
                ]
            })
        })

        function addId(ns, obj) {
            obj.id = computeConstructorId(ns, obj)
            return obj
        }

        console.log('vv choose B vv')
        await testMergeSchemas('conflicting class', {
            help: makeNamespace({
                classes: [
                    addId('help', {
                        name: 'configSimple',
                        type: 'ConfigSimple',
                        arguments: [
                            {
                                name: 'flags',
                                type: '$FlagsBitField'
                            },
                            {
                                name: 'date',
                                type: 'number'
                            }
                        ]
                    })
                ]
            })
        }, {
            help: makeNamespace({
                classes: [
                    addId('help', {
                        name: 'configSimple',
                        type: 'ConfigSimple',
                        arguments: [
                            {
                                name: 'flags',
                                type: '$FlagsBitField'
                            },
                            {
                                name: 'date',
                                type: 'number'
                            },
                            {
                                name: 'expires',
                                type: 'number'
                            }
                        ]
                    })
                ]
            })
        }, {
            help: makeNamespace({
                classes: [
                    addId('help', {
                        name: 'configSimple',
                        type: 'ConfigSimple',
                        arguments: [
                            {
                                name: 'flags',
                                type: '$FlagsBitField'
                            },
                            {
                                name: 'date',
                                type: 'number'
                            },
                            {
                                name: 'expires',
                                type: 'number'
                            }
                        ]
                    })
                ]
            })
        })
    }

    test().catch(console.error)
}
