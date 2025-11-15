import * as fs from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KNOWN_DECORATORS = ['memoizeGetters', 'makeInspectable']

/** @type {import('@fuman/build/vite').CustomBuildConfig} */
export default () => {
  const networkManagerId = fileURLToPath(new URL('./src/network/network-manager.ts', import.meta.url))
  const highlevelTypesDir = fileURLToPath(new URL('./src/highlevel/types', import.meta.url))

  // make decorators properly tree-shakeable
  // very fragile, but it kinda works :D
  // skip for jsr for now because types aren't resolved correctly and it breaks everything (TODO: fix this)
  const decoratorsRegex = new RegExp(
    `(${KNOWN_DECORATORS.join('|')})\\((.+?)\\)(?:;|$)`,
    'gms',
  )

  return {
    pluginsPre: [
      {
        name: 'mtcute-core-build-plugin',
        transform(code, id) {
          if (id === networkManagerId) {
            const require = createRequire(import.meta.url)
            const version = require(fileURLToPath(new URL('./package.json', import.meta.url))).version
            return code.replace('%VERSION%', version)
          }

          if (id.startsWith(highlevelTypesDir)) {
            if (!KNOWN_DECORATORS.some(d => code.includes(d))) return null

            const countPerClass = new Map()

            code = code.replace(decoratorsRegex, (_, name, args) => {
              const [clsName_, ...rest] = args.split(',')
              const clsName = clsName_.trim()

              const count = (countPerClass.get(clsName) || 0) + 1
              countPerClass.set(clsName, count)

              const prevName = count === 1 ? clsName : `${clsName}$${count - 1}`
              const localName = `${clsName}$${count}`

              return `const ${localName} = /*#__PURE__*/${name}(${prevName}, ${rest.join(',')});`
            })

            if (countPerClass.size === 0) {
              throw new Error('No decorator usages found, but known names were used')
            }

            const customExports = []

            for (const [clsName, count] of countPerClass) {
              const needle = new RegExp(`^export class(?= ${clsName} ({|extends ))`, 'm')

              if (!code.match(needle)) {
                throw new Error(`Class ${clsName} not found in ${id.replace(import.meta.url, '')}`)
              }

              code = code.replace(needle, 'class')
              customExports.push(`export { ${clsName}$${count} as ${clsName} }`)
            }

            return `${code}\n${customExports.join('\n')}\n`
          }

          return code
        },
      },
    ],
    finalizeJsr({ outDir }) {
      const networkMgrFile = resolve(outDir, 'network/network-manager.ts')
      const code = fs.readFileSync(networkMgrFile, 'utf8')

      const require = createRequire(import.meta.url)
      const version = require(fileURLToPath(new URL('./package.json', import.meta.url))).version
      fs.writeFileSync(networkMgrFile, code.replace('%VERSION%', version))
    },
  }
}
