const fs = require('fs')
const path = require('path')
const prettier = require('prettier')

const snakeToCamel = (s) => {
    return s.replace(/(?<!^|_)(_[a-z0-9])/gi, ($1) => {
        return $1.substr(1).toUpperCase()
    })
}

const camelToPascal = (s) => s[0].toUpperCase() + s.substr(1)

const camelToSnake = (s) => {
    return s.replace(/(?<=[a-zA-Z0-9])([A-Z0-9]+(?=[A-Z]|$)|[A-Z0-9])/g, ($1) => {
        return '_' + $1.toLowerCase()
    })
}

function parseUpdateTypes() {
    const lines = fs
        .readFileSync(path.join(__dirname, 'update-types.txt'), 'utf-8')
        .split('\n')
        .map((it) => it.trim())
        .filter((it) => it && it[0] !== '#')

    const ret = []

    for (const line of lines) {
        const m = line.match(/^([a-z_]+)(?:: ([a-zA-Z]+))? = ([a-zA-Z]+(?:\[\])?)( \+ State)?(?: in ([a-zA-Z]+))?$/)
        if (!m) throw new Error(`invalid syntax: ${line}`)
        ret.push({
            typeName: m[1],
            handlerTypeName: m[2] || camelToPascal(snakeToCamel(m[1])),
            updateType: m[3],
            funcName: m[2] ? m[2][0].toLowerCase() + m[2].substr(1) : snakeToCamel(m[1]),
            state: Boolean(m[4]),
            context: m[5] ?? `UpdateContext<${m[3]}>`,
        })
    }

    return ret
}

function replaceSections(filename, sections, dir = __dirname) {
    let lines = fs.readFileSync(path.join(dir, '../src', filename), 'utf-8').split('\n')

    const findMarker = (marker) => {
        const idx = lines.findIndex((line) => line.trim() === `// ${marker}`)
        if (idx === -1) throw new Error(marker + ' not found')

        return idx
    }

    for (const [name, content] of Object.entries(sections)) {
        const start = findMarker(`begin-${name}`)
        const end = findMarker(`end-${name}`)

        if (start > end) throw new Error('begin is after end')

        lines.splice(start + 1, end - start - 1, content)
    }

    fs.writeFileSync(path.join(dir, '../src', filename), lines.join('\n'))
}

const types = parseUpdateTypes()

async function formatFile(filename, dir = __dirname) {
    const targetFile = path.join(dir, '../src/', filename)
    const prettierConfig = await prettier.resolveConfig(targetFile)
    let fullSource = await fs.promises.readFile(targetFile, 'utf-8')
    fullSource = await prettier.format(fullSource, {
        ...(prettierConfig || {}),
        filepath: targetFile,
    })
    await fs.promises.writeFile(targetFile, fullSource)
}

function toSentence(type, stype = 'inline') {
    const name = camelToSnake(type.handlerTypeName).toLowerCase().replace(/_/g, ' ')

    if (stype === 'inline') {
        return `${name[0].match(/[aeiouy]/i) ? 'an' : 'a'} ${name} handler`
    } else if (stype === 'plain') {
        return `${name} handler`
    }

    return `${name[0].toUpperCase()}${name.substr(1)} handler`
}

function generateParsedUpdate() {
    replaceSections('highlevel/types/updates/index.ts', {
        codegen:
            'export type ParsedUpdate =\n' +
            types.map((typ) => `    | { name: '${typ.typeName}'; data: ${typ.updateType} }\n`).join(''),
    })
}

async function main() {
    generateParsedUpdate()
}

module.exports = { types, toSentence, replaceSections, formatFile }

if (require.main === module) {
    main().catch(console.error)
}
