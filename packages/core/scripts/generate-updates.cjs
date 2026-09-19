const fs = require('node:fs')
const path = require('node:path')

function snakeToCamel(s) {
  return s.replace(/(?<!^|_)(_[a-z0-9])/gi, ($1) => {
    return $1.substr(1).toUpperCase()
  })
}

const camelToPascal = s => s[0].toUpperCase() + s.substr(1)

function camelToSnake(s) {
  return s.replace(/(?<=[a-zA-Z0-9])([A-Z0-9]+(?=[A-Z]|$)|[A-Z0-9])/g, ($1) => {
    return `_${$1.toLowerCase()}`
  })
}

function parseUpdateTypes() {
  const entries = JSON.parse(fs.readFileSync(path.join(__dirname, 'update-types.json'), 'utf-8'))

  return entries.map(({ name, handler, type, state, context }) => ({
    typeName: name,
    handlerTypeName: handler ?? camelToPascal(snakeToCamel(name)),
    updateType: type,
    funcName: handler ? handler[0].toLowerCase() + handler.substr(1) : snakeToCamel(name),
    state: Boolean(state),
    context: context ?? `UpdateContext<${type}>`,
  }))
}

function replaceSections(filename, sections, dir = __dirname) {
  const lines = fs.readFileSync(path.join(dir, '../src', filename), 'utf-8').split('\n')

  const findMarker = (marker) => {
    const idx = lines.findIndex(line => line.trim() === `// ${marker}`)
    if (idx === -1) throw new Error(`${marker} not found`)

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
            `export type ParsedUpdate =\n${
              types.map(typ => `    | { name: '${typ.typeName}'; data: ${typ.updateType} }\n`).join('')}`,
  })
}

async function main() {
  generateParsedUpdate()
}

module.exports = { types, toSentence, replaceSections }

if (require.main === module) {
  main().catch(console.error)
}
