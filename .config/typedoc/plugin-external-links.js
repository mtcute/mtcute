import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function load(app) {
  const schema = JSON.parse(readFileSync(join(__dirname, '../../packages/core/src/tl/api-schema.json'), 'utf8'))
  const schemaLayer = schema.l
  const methods = new Set(schema.e.filter(entry => entry.kind === 'method').map(entry => entry.name))

  app.converter.addUnknownSymbolResolver((declaration) => {
    const symbol = declaration.symbolReference?.path?.map(path => path.path).join('.')

    if (symbol === 'Long' || symbol === 'tl.Long') {
      return {
        target: 'https://github.com/dcodeIO/long.js',
        caption: symbol,
      }
    }

    if (symbol.startsWith('tl.')) {
      let [ns, name] = symbol.slice(3).split('.')

      if (!name) {
        name = ns
        ns = null
      }

      let kind = null

      if (name.startsWith('Type')) {
        name = name.slice(4)
        kind = 'type'
      } else if (name.startsWith('Raw')) {
        name = name[3].toLowerCase() + name.slice(4)
        kind = 'constructor'

        const methodName = name.slice(0, -7)

        if (name.endsWith('Request') && methods.has(ns ? `${ns}.${methodName}` : methodName)) {
          name = methodName
          kind = 'method'
        }
      }

      name = (ns ? `${ns}.` : '') + name

      return {
        target: kind && ns !== 'mtcute'
          ? `https://schema.jppgr.am/${kind}/${name}`
          : `https://schema.jppgr.am/layer/${schemaLayer}/${name}`,
        caption: symbol,
      }
    }
  })
}
