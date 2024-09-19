import { fileURLToPath } from 'node:url'
import * as fs from 'node:fs'
import * as cp from 'node:child_process'
import { resolve } from 'node:path'

import { populateFromUpstream } from '@fuman/jsr'
import * as glob from 'glob'
import ts from 'typescript'

import { processPackageJson } from '../.config/vite-utils/package-json.js'

export function packageJsonToDeno({ packageJson, packageJsonOrig }) {
    // https://jsr.io/docs/package-configuration

    const importMap = {}
    const exports = {}

    if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(packageJson.dependencies)) {
            if (name.startsWith('@mtcute/')) {
                importMap[name] = `jsr:${name}@${version}`
            } else if (version.startsWith('npm:@jsr/')) {
                const jsrName = version.slice(9).split('@')[0].replace('__', '/')
                const jsrVersion = version.slice(9).split('@')[1]
                importMap[name] = `jsr:@${jsrName}@${jsrVersion}`
            } else {
                importMap[name] = `npm:${name}@${version}`
            }
        }
    }

    if (packageJsonOrig.exports) {
        let tmpExports
        if (typeof packageJsonOrig.exports === 'string') {
            tmpExports = { '.': packageJsonOrig.exports }
        } else if (typeof packageJsonOrig.exports !== 'object') {
            throw new TypeError('package.json exports must be an object')
        } else {
            tmpExports = packageJsonOrig.exports
        }

        for (const [name, value] of Object.entries(tmpExports)) {
            if (typeof value !== 'string') {
                throw new TypeError(`package.json exports value must be a string: ${name}`)
            }
            if (value.endsWith('.wasm')) continue

            exports[name] = value
                .replace(/^\.\/src\//, './')
                .replace(/\.js$/, '.ts')
        }
    }

    return {
        name: packageJson.name,
        version: packageJson.version,
        exports,
        exclude: ['**/*.test.ts', '**/*.test-utils.ts', '**/__fixtures__/**'],
        imports: importMap,
        publish: {
            exclude: ['!../dist'], // lol
        },
        ...packageJson.denoJson,
    }
}

export async function runJsrBuildSync(packageName) {
    const packageDir = fileURLToPath(new URL(`../packages/${packageName}`, import.meta.url))
    const outDir = fileURLToPath(new URL(`../packages/${packageName}/dist/jsr`, import.meta.url))
    fs.rmSync(outDir, { recursive: true, force: true })
    fs.mkdirSync(outDir, { recursive: true })

    console.log('[i] Copying sources...')
    fs.cpSync(resolve(packageDir, 'src'), outDir, { recursive: true })

    const printer = ts.createPrinter()

    for (const f of glob.sync(resolve(outDir, '**/*.ts'))) {
        let fileContent = fs.readFileSync(f, 'utf8')
        let changed = false

        // replace .js imports with .ts
        const file = ts.createSourceFile(f, fileContent, ts.ScriptTarget.ESNext, true)
        let changedTs = false

        for (const imp of file.statements) {
            if (imp.kind !== ts.SyntaxKind.ImportDeclaration && imp.kind !== ts.SyntaxKind.ExportDeclaration) {
                continue
            }
            if (imp.kind === ts.SyntaxKind.ExportDeclaration && !imp.moduleSpecifier) {
                continue
            }
            const mod = imp.moduleSpecifier.text

            if (mod[0] === '.' && mod.endsWith('.js')) {
                changedTs = true
                imp.moduleSpecifier = {
                    kind: ts.SyntaxKind.StringLiteral,
                    text: `${mod.slice(0, -3)}.ts`,
                }
            }
        }

        if (changedTs) {
            fileContent = printer.printFile(file)
            changed = true
        }

        // add shims for node-specific APIs and replace NodeJS.* types
        // pretty fragile, but it works for now
        const typesToReplace = {
            'NodeJS\\.Timeout': 'number',
            'NodeJS\\.Immediate': 'number',
        }
        const nodeSpecificApis = {
            setImmediate: '(cb: (...args: any[]) => void, ...args: any[]) => number',
            clearImmediate: '(id: number) => void',
            Buffer:
                '{ '
                + 'concat: (...args: any[]) => Uint8Array, '
                + 'from: (data: any, encoding?: string) => { toString(encoding?: string): string }, '
                + ' }',
            SharedWorker: ['type', 'never'],
            WorkerGlobalScope:
                '{ '
                + '  new (): typeof WorkerGlobalScope, '
                + '  postMessage: (message: any, transfer?: Transferable[]) => void, '
                + '  addEventListener: (type: "message", listener: (ev: MessageEvent) => void) => void, '
                + ' }',
            process: '{ ' + 'hrtime: { bigint: () => bigint }, ' + '}',
        }

        for (const [name, decl_] of Object.entries(nodeSpecificApis)) {
            if (fileContent.includes(name)) {
                if (name === 'Buffer' && fileContent.includes('node:buffer')) continue

                changed = true
                const isType = Array.isArray(decl_) && decl_[0] === 'type'
                const decl = isType ? decl_[1] : decl_

                if (isType) {
                    fileContent = `declare type ${name} = ${decl};\n${fileContent}`
                } else {
                    fileContent = `declare const ${name}: ${decl};\n${fileContent}`
                }
            }
        }

        for (const [oldType, newType] of Object.entries(typesToReplace)) {
            if (fileContent.match(oldType)) {
                changed = true
                fileContent = fileContent.replace(new RegExp(oldType, 'g'), newType)
            }
        }

        if (changed) {
            fs.writeFileSync(f, fileContent)
        }
    }

    const { packageJson, packageJsonOrig } = processPackageJson(packageDir)
    const denoJson = packageJsonToDeno({ packageJson, packageJsonOrig })

    fs.writeFileSync(resolve(outDir, 'deno.json'), JSON.stringify(denoJson, null, 2))
    fs.cpSync(new URL('../LICENSE', import.meta.url), resolve(outDir, 'LICENSE'), { recursive: true })

    if (process.env.E2E) {
        // populate dependencies, if any
        const depsToPopulate = []

        for (const dep of Object.values(denoJson.imports)) {
            if (!dep.startsWith('jsr:')) continue
            if (dep.startsWith('jsr:@mtcute/')) continue
            depsToPopulate.push(dep.slice(4))
        }

        if (depsToPopulate.length) {
            console.log('[i] Populating %d dependencies...', depsToPopulate.length)
            await populateFromUpstream({
                downstream: process.env.JSR_URL,
                token: process.env.JSR_TOKEN,
                unstable_createViaApi: true,
                packages: depsToPopulate,
            })
        }
    }

    let customConfig
    try {
        customConfig = await (await import(resolve(packageDir, 'build.config.js'))).default()
    } catch {}

    if (customConfig) {
        await customConfig.finalJsr?.({ packageDir, outDir })
    }

    console.log('[i] Trying to publish with --dry-run')
    cp.execSync('deno publish --dry-run --allow-dirty --quiet', { cwd: outDir, stdio: 'inherit' })
    console.log('[v] All good!')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const PACKAGE_NAME = process.argv[2]

    if (!PACKAGE_NAME) {
        throw new Error('package name not specified')
    }

    await runJsrBuildSync(PACKAGE_NAME)
}
