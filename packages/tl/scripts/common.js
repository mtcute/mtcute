const fs = require('fs')
const path = require('path')

const createWriter = (file, dir = __dirname) => {
    let indent = ''
    let output = fs.createWriteStream(path.join(dir, file))

    const funcs = {
        get indent() {
            return indent
        },
        tab: () => (indent += '    '),
        untab: () => (indent = indent.substr(0, indent.length - 4)),
        wrap: (s, pref = '', exceptFirst = false) =>
            s
                .replace(/(?![^\n]{1,90}$)([^\n]{1,90})\s/g, '$1\n')
                .replace(/@see\n(.+?)}/g, '@see $1}\n')
                .split('\n')
                .map((it, i) => (!exceptFirst || i !== 0 ? pref + it : it))
                .join('\n'),
        write: (text = '', end = '\n') =>
            output.write(
                text
                    .split('\n')
                    .map((i) => indent + i)
                    .join('\n') + end
            ),
        comment: (text) =>
            funcs.write('/**\n' + funcs.wrap(text, '* ') + '\n' + '*/'),
    }

    return funcs
}

const camelToPascal = (s) => s[0].toUpperCase() + s.substr(1)
const snakeToCamel = (s) => {
    return s.replace(/(?<!^|_)(_[a-z0-9])/gi, ($1) => {
        return $1.substr(1).toUpperCase()
    })
}
const camelToSnake = (s) => {
    return s.replace(
        /(?<=[a-zA-Z0-9])([A-Z0-9]+(?=[A-Z]|$)|[A-Z0-9])/g,
        ($1) => {
            return '_' + $1.toLowerCase()
        }
    )
}
const snakeToPascal = (s) => camelToPascal(snakeToCamel(s))

const signedInt32ToUnsigned = (val) => val >>> 0

module.exports = {
    createWriter,
    camelToPascal,
    snakeToCamel,
    camelToSnake,
    snakeToPascal,
    signedInt32ToUnsigned
}
