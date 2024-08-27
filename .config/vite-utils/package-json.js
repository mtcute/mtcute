import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootPackageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'))
const packagesDir = fileURLToPath(new URL('../../packages', import.meta.url))
const IS_JSR = process.env.JSR === '1'

export function getPackageVersion(name) {
    const json = JSON.parse(readFileSync(resolve(packagesDir, name, 'package.json'), 'utf-8'))
    return json.version
}

export function processPackageJson(packageDir) {
    const packageJsonOrig = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf-8'))
    const packageJson = structuredClone(packageJsonOrig)
    const entrypoints = {}

    // copy common fields from root
    for (const field of ['license', 'author', 'contributors', 'homepage', 'repository', 'bugs']) {
        if (rootPackageJson[field]) {
            packageJson[field] = rootPackageJson[field]
        }
    }

    const newScripts = {}

    if (packageJson.keepScripts) {
        for (const script of packageJson.keepScripts) {
            newScripts[script] = packageJson.scripts[script]
        }
        delete packageJson.keepScripts
    }
    packageJson.scripts = newScripts
    delete packageJson.devDependencies
    delete packageJson.private

    if (packageJson.distOnlyFields) {
        Object.assign(packageJson, packageJson.distOnlyFields)
        delete packageJson.distOnlyFields
    }

    if (packageJson.jsrOnlyFields) {
        if (IS_JSR) {
            Object.assign(packageJson, packageJson.jsrOnlyFields)
        }
        delete packageJson.jsrOnlyFields
    }

    function replaceWorkspaceDependencies(field) {
        if (!packageJson[field]) return

        const dependencies = packageJson[field]

        for (const name of Object.keys(dependencies)) {
            const value = dependencies[name]

            if (value.startsWith('workspace:')) {
                if (value !== 'workspace:^' && value !== 'workspace:*') {
                    throw new Error(
                        `Cannot replace workspace dependency ${name} with ${value} - only workspace:^ and * are supported`,
                    )
                }
                if (!name.startsWith('@mtcute/')) {
                    throw new Error(`Cannot replace workspace dependency ${name} - only @mtcute/* is supported`)
                }

                // note: pnpm replaces workspace:* with the current version, unlike this script
                const depVersion = value === 'workspace:*' ? '*' : `^${getPackageVersion(name.slice(8))}`
                dependencies[name] = depVersion
            }
        }
    }

    replaceWorkspaceDependencies('dependencies')
    replaceWorkspaceDependencies('devDependencies')
    replaceWorkspaceDependencies('peerDependencies')
    replaceWorkspaceDependencies('optionalDependencies')

    delete packageJson.typedoc

    if (packageJson.browser) {
        function maybeFixPath(p, repl) {
            if (!p) return p

            if (p.startsWith('./src/')) {
                return repl + p.slice(6)
            }

            if (p.startsWith('./')) {
                return repl + p.slice(2)
            }

            return p
        }

        for (const key of Object.keys(packageJson.browser)) {
            if (!key.startsWith('./src/')) continue

            const path = key.slice(6)
            packageJson.browser[`./esm/${path}`] = maybeFixPath(packageJson.browser[key], './esm/')

            delete packageJson.browser[key]
        }
    }

    if (packageJson.exports) {
        let exports = packageJson.exports
        if (typeof exports === 'string') {
            exports = { '.': exports }
        }
        if (typeof exports !== 'object') {
            throw new TypeError('package.json exports must be an object')
        }

        const newExports = {}
        for (const [key, value] of Object.entries(exports)) {
            if (typeof value !== 'string') {
                throw new TypeError(`package.json exports value must be a string: ${key}`)
            }
            if (value.endsWith('.wasm')) {
                newExports[key] = value
                continue
            }

            let entrypointName = key.replace(/^\.(\/|$)/, '').replace(/\.js$/, '')
            if (entrypointName === '') entrypointName = 'index'

            entrypoints[entrypointName] = value
            newExports[key] = {
                import: {
                    types: `./${entrypointName}.d.ts`,
                    default: `./${entrypointName}.js`,
                },
                require: {
                    types: `./${entrypointName}.d.cts`,
                    default: `./${entrypointName}.cjs`,
                },
            }
        }

        packageJson.exports = newExports
    }

    if (typeof packageJson.bin === 'object') {
        const newBin = {}
        for (const [key, value] of Object.entries(packageJson.bin)) {
            if (typeof value !== 'string') {
                throw new TypeError(`package.json bin value must be a string: ${key}`)
            }

            let entrypointName = key.replace(/^\.(\/|$)/, '').replace(/\.js$/, '')
            if (entrypointName === '') entrypointName = 'index'

            entrypoints[entrypointName] = value
            newBin[key] = `./${entrypointName}.js`
        }

        packageJson.bin = newBin
    }

    return {
        packageJsonOrig,
        packageJson,
        entrypoints,
    }
}
