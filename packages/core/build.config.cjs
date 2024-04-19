const KNOWN_DECORATORS = ['memoizeGetters', 'makeInspectable']

module.exports = ({ path, glob, transformFile, packageDir, outDir, jsr }) => ({
    esmOnlyDirectives: true,
    esmImportDirectives: true,
    final() {
        const version = require(path.join(packageDir, 'package.json')).version
        const replaceVersion = (content) => content.replace('%VERSION%', version)

        if (jsr) {
            transformFile(path.join(outDir, 'network/network-manager.ts'), replaceVersion)
        } else {
            transformFile(path.join(outDir, 'cjs/network/network-manager.js'), replaceVersion)
            transformFile(path.join(outDir, 'esm/network/network-manager.js'), replaceVersion)
        }

        if (jsr) return

        // make decorators properly tree-shakeable
        // very fragile, but it works for now :D
        // skip for jsr for now because types aren't resolved correctly and it breaks everything (TODO: fix this)
        const decoratorsRegex = new RegExp(
            `(${KNOWN_DECORATORS.join('|')})\\((.+?)\\)(?:;|$)`,
            'gsm',
        )

        const replaceDecorators = (content, file) => {
            if (!KNOWN_DECORATORS.some((d) => content.includes(d))) return null

            const countPerClass = new Map()

            content = content.replace(decoratorsRegex, (_, name, args) => {
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

                if (!content.match(needle)) {
                    throw new Error(`Class ${clsName} not found in ${file}`)
                }

                content = content.replace(needle, 'class')
                customExports.push(
                    `export { ${clsName}$${count} as ${clsName} }`,
                )
            }

            return content + '\n' + customExports.join('\n') + '\n'
        }

        const globSrc = path.join(outDir, jsr ? 'highlevel/types/**/*.ts' : 'esm/highlevel/types/**/*.js')

        for (const f of glob.sync(globSrc)) {
            transformFile(f, replaceDecorators)
        }
    },
})
