// converts object-based schema to array-based
function convertToArrays(ns) {
    const ret = {
        classes: [],
        methods: [],
        unions: [],
    }

    Object.entries(ns).forEach(([ns, content]) => {
        const prefix = ns === '$root' ? '' : `${ns}.`

        content.classes.forEach((cls) => {
            cls.rawName = cls.name
            cls.name = prefix + cls.name
            cls.namespace = ns
            ret.classes.push(cls)
        })

        content.methods.forEach((cls) => {
            cls.rawName = cls.name
            cls.name = prefix + cls.name
            cls.namespace = ns
            ret.methods.push(cls)
        })

        content.unions.forEach((cls) => {
            cls.rawName = cls.type
            cls.type = prefix + cls.type
            cls.namespace = ns
            ret.unions.push(cls)
        })
    })

    return ret
}

const marked = require('marked')

const pascalToCamel = (s) => s[0].toLowerCase() + s.substr(1)
const camelToSnake = (str) =>
    str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
const camelToPascal = (s) => s[0].toUpperCase() + s.substr(1)

function renderDescription(description) {
    return marked.parseInline(
        description.replace(/{@link (.+?)}/g, (_, name) => {
            if (name.startsWith('tl.')) {
                let [ns, type] = name.substr(3).split('.')
                if (!type) {
                    type = ns
                    ns = undefined
                }

                let path, displayName, m
                if ((m = type.match(/^Raw([A-Za-z0-9_]+?)(Request)?$/))) {
                    const [, name, isMethod] = m
                    path = `${ns === 'mtproto' ? ns : ''}/${
                        isMethod ? 'method' : 'class'
                    }/${ns !== 'mtproto' ? ns + '.' : ''}${pascalToCamel(name)}`
                    displayName =
                        (ns ? ns + (ns === 'mtproto' ? '/' : '.') : '') +
                        pascalToCamel(name)
                } else if ((m = type.match(/^Type([A-Za-z0-9_]+?)$/))) {
                    path = `${ns === 'mtproto' ? ns : ''}/union/${
                        ns !== 'mtproto' ? ns + '.' : ''
                    }${m[1]}`
                    displayName =
                        (ns ? ns + (ns === 'mtproto' ? '/' : '.') : '') +
                        pascalToCamel(name)
                }

                if (path) {
                    return `[${displayName}](/${path})`
                }
            }
            return `\`${name}\``
        })
    )
}

function prepareData(data) {
    Object.values(data).forEach((arr) =>
        arr.forEach((item) => {
            // add hex constructor id
            if (item.id) item.tlId = item.id.toString(16).padStart(8, '0')

            // raw non-array type for usages count
            if (item.arguments) item.arguments.forEach((arg) => {
                arg.rawType = arg.type.replace(/\[]$/, '')
            })
            if (item.returns) item.rawReturns = item.returns.replace(/\[]$/, '')

            // add typescript types for the item and arguments
            // basically copy-pasted from generate-types.js
            const prefix_ = item.prefix === 'mtproto/' ? 'mt_' : ''
            let baseTypePrefix =
                item.prefix === 'mtproto/' ? 'tl.mtproto.' : 'tl.'

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

            if (item.subtypes) {
                item.ts = 'Type' + item.rawName
            } else {
                item.ts =
                    'Raw' +
                    camelToPascal(item.rawName) +
                    (item.returns ? 'Request' : '')
                item.underscore = prefix_ + item.name
            }

            // render descriptions in markdown
            if (item.description)
                item.description = renderDescription(item.description)
            if (item.arguments)
                item.arguments.forEach((arg) => {
                    if (arg.description)
                        arg.description = renderDescription(arg.description)
                    arg.ts = fullTypeName(arg.type)
                })
        })
    )
}

module.exports = { convertToArrays, prepareData }
