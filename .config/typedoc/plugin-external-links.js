import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function load(app) {
  const schemaLayer = JSON.parse(readFileSync(join(__dirname, '../../packages/core/src/tl/api-schema.json'), 'utf8')).l

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

      if (name.startsWith('Type')) {
        name = name.slice(4)
      } else if (name.startsWith('Raw')) {
        name = name[3].toLowerCase() + name.slice(4)

        if (name.endsWith('Request')) {
          name = name.slice(0, -7)
        }
      }

      name = (ns ? `${ns}.` : '') + name

      return {
        target: `https://schema.jppgr.am/layer/${schemaLayer}/${name}`,
        caption: symbol,
      }
    }
  })
}
