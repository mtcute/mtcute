/* eslint-disable no-inner-declarations */
const cp = require('child_process')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const ts = require('typescript')
const stc = require('@teidesu/slow-types-compiler')

if (process.argv.length < 3) {
    console.log('Usage: build-package.js <package name>')
    process.exit(0)
}

const IS_JSR = process.env.JSR === '1'

const packagesDir = path.join(__dirname, '../packages')
const packageDir = path.join(packagesDir, process.argv[2])
let outDir = path.join(packageDir, 'dist')
if (IS_JSR) outDir = path.join(outDir, 'jsr')

function exec(cmd, params) {
    cp.execSync(cmd, { cwd: packageDir, stdio: 'inherit', ...params })
}

function transformFile(file, transform) {
    const content = fs.readFileSync(file, 'utf8')
    const res = transform(content, file)
    if (res != null) fs.writeFileSync(file, res)
}

const buildConfig = {
    buildTs: true,
    buildCjs: true,
    removeReferenceComments: true,
    replaceSrcImports: true,
    esmOnlyDirectives: false,
    esmImportDirectives: false,
    before: () => {},
    final: () => {},
    ...(() => {
        let config

        try {
            config = require(path.join(packageDir, 'build.config.cjs'))
        } catch (e) {
            if (e.code !== 'MODULE_NOT_FOUND') throw e

            return {}
        }

        console.log('[i] Using custom build config')

        if (typeof config === 'function') {
            config = config({
                fs,
                path,
                glob,
                exec,
                transformFile,
                packageDir,
                outDir,
                jsr: IS_JSR,
            })
        }

        return config
    })(),
}

function getPackageVersion(name) {
    return require(path.join(packagesDir, name, 'package.json')).version
}

function buildPackageJson() {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf-8'))

    if (buildConfig.buildCjs) {
        pkgJson.main = 'cjs/index.js'
        pkgJson.module = 'esm/index.js'
    }

    const newScripts = {}

    if (pkgJson.keepScripts) {
        for (const script of pkgJson.keepScripts) {
            newScripts[script] = pkgJson.scripts[script]
        }
        delete pkgJson.keepScripts
    }
    pkgJson.scripts = newScripts
    delete pkgJson.devDependencies
    delete pkgJson.private

    if (pkgJson.distOnlyFields) {
        Object.assign(pkgJson, pkgJson.distOnlyFields)
        delete pkgJson.distOnlyFields
    }

    if (pkgJson.jsrOnlyFields) {
        if (IS_JSR) {
            Object.assign(pkgJson, pkgJson.jsrOnlyFields)
        }
        delete pkgJson.jsrOnlyFields
    }

    function replaceWorkspaceDependencies(field) {
        if (!pkgJson[field]) return

        const dependencies = pkgJson[field]

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

    delete pkgJson.typedoc

    if (pkgJson.browser) {
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

        for (const key of Object.keys(pkgJson.browser)) {
            if (!key.startsWith('./src/')) continue

            const path = key.slice(6)
            pkgJson.browser[`./esm/${path}`] = maybeFixPath(pkgJson.browser[key], './esm/')

            if (buildConfig.buildCjs) {
                pkgJson.browser[`./cjs/${path}`] = maybeFixPath(pkgJson.browser[key], './cjs/')
            }

            delete pkgJson.browser[key]
        }
    }

    // fix exports
    if (pkgJson.exports) {
        function maybeFixPath(path, repl) {
            if (!path) return path
            if (pkgJson.exportsKeepPath?.includes(path)) return path

            if (path.startsWith('./src/')) {
                path = repl + path.slice(6)
            } else if (path.startsWith('./')) {
                path = repl + path.slice(2)
            }

            return path.replace(/\.ts$/, '.js')
        }

        function fixValue(value) {
            if (IS_JSR) {
                return maybeFixPath(value, './').replace(/\.js$/, '.ts')
            }

            if (buildConfig.buildCjs) {
                return {
                    import: maybeFixPath(value, './esm/'),
                    require: maybeFixPath(value, './cjs/'),
                }
            }

            return maybeFixPath(value, './')
        }

        if (typeof pkgJson.exports === 'string') {
            pkgJson.exports = {
                '.': fixValue(pkgJson.exports),
            }
        } else {
            for (const key of Object.keys(pkgJson.exports)) {
                const value = pkgJson.exports[key]

                if (typeof value !== 'string') {
                    throw new Error('Conditional exports are not supported')
                }

                pkgJson.exports[key] = fixValue(value)
            }
        }

        delete pkgJson.exportsKeepPath
    }

    if (!IS_JSR) {
        fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(pkgJson, null, 2))
    }

    return pkgJson
}

// clean
fs.rmSync(path.join(outDir), { recursive: true, force: true })
fs.mkdirSync(path.join(outDir), { recursive: true })

// for jsr - copy typescript sources
if (IS_JSR) {
    buildConfig.buildCjs = false
}

buildConfig.before()

if (buildConfig.buildTs && !IS_JSR) {
    console.log('[i] Building typescript...')

    const tsconfigPath = path.join(packageDir, 'tsconfig.json')
    fs.cpSync(tsconfigPath, path.join(packageDir, 'tsconfig.backup.json'))

    const tsconfig = ts.parseConfigFileTextToJson(tsconfigPath, fs.readFileSync(tsconfigPath, 'utf-8')).config

    if (tsconfig.extends === '../../tsconfig.json') {
        tsconfig.extends = '../../.config/tsconfig.build.json'
    } else {
        throw new Error('expected tsconfig to extend base config')
    }

    fs.writeFileSync(path.join(packageDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2))

    const restoreTsconfig = () => {
        fs.renameSync(path.join(packageDir, 'tsconfig.backup.json'), path.join(packageDir, 'tsconfig.json'))
    }

    try {
        exec('pnpm exec tsc --build', { cwd: packageDir, stdio: 'inherit' })
    } catch (e) {
        restoreTsconfig()
        throw e
    }

    if (buildConfig.buildCjs) {
        console.log('[i] Building typescript (CJS)...')
        const originalFiles = {}

        for (const f of glob.sync(path.join(packagesDir, '**/*.ts'))) {
            const content = fs.readFileSync(f, 'utf8')
            if (!content.includes('@only-if-esm')) continue
            originalFiles[f] = content

            fs.writeFileSync(f, content.replace(/@only-if-esm.*?@\/only-if-esm/gs, ''))
        }
        for (const f of glob.sync(path.join(packagesDir, '**/*.ts'))) {
            const content = fs.readFileSync(f, 'utf8')
            if (!content.includes('@esm-replace-import')) continue
            originalFiles[f] = content

            fs.writeFileSync(f, content.replace(/(?<=@esm-replace-import.*?)await import/gs, 'require'))
        }

        // set type=commonjs in all package.json-s
        for (const pkg of fs.readdirSync(packagesDir)) {
            const pkgJson = path.join(packagesDir, pkg, 'package.json')
            if (!fs.existsSync(pkgJson)) continue

            const orig = fs.readFileSync(pkgJson, 'utf8')
            originalFiles[pkgJson] = orig

            fs.writeFileSync(
                pkgJson,
                JSON.stringify(
                    {
                        ...JSON.parse(orig),
                        type: 'commonjs',
                    },
                    null,
                    2,
                ),
            )

            // maybe also dist/package.json
            const distPkgJson = path.join(packagesDir, pkg, 'dist/package.json')

            if (fs.existsSync(distPkgJson)) {
                const orig = fs.readFileSync(distPkgJson, 'utf8')
                originalFiles[distPkgJson] = orig

                fs.writeFileSync(
                    distPkgJson,
                    JSON.stringify(
                        {
                            ...JSON.parse(orig),
                            type: 'commonjs',
                        },
                        null,
                        2,
                    ),
                )
            }
        }

        let error = false

        try {
            exec('pnpm exec tsc --outDir dist/cjs', {
                cwd: packageDir,
                stdio: 'inherit',
            })
        } catch (e) {
            error = e
        }

        for (const f of Object.keys(originalFiles)) {
            fs.writeFileSync(f, originalFiles[f])
        }

        if (error) {
            restoreTsconfig()
            throw error
        }
    }

    restoreTsconfig()

    // todo: can we remove these?
    console.log('[i] Post-processing...')

    if (buildConfig.removeReferenceComments) {
        for (const f of glob.sync(path.join(outDir, '**/*.d.ts'))) {
            let content = fs.readFileSync(f, 'utf8')
            let changed = false

            if (content.indexOf('/// <reference types="node" />') !== -1) {
                changed = true
                content = content.replace('/// <reference types="node" />', '')
            }

            if (content.match(/@mtcute\/[a-z-]+\/src/)) {
                changed = true
                content = content.replace(/(@mtcute\/[a-z-]+)\/src/g, '$1')
            }

            if (changed) fs.writeFileSync(f, content)
        }
    }

    if (buildConfig.replaceSrcImports) {
        for (const f of glob.sync(path.join(outDir, '**/*.js'))) {
            let content = fs.readFileSync(f, 'utf8')
            let changed = false

            if (content.match(/@mtcute\/[a-z-]+\/src/)) {
                changed = true
                content = content.replace(/(@mtcute\/[a-z-]+)\/src/g, '$1')
            }

            if (changed) fs.writeFileSync(f, content)
        }
    }
} else if (buildConfig.buildTs && IS_JSR) {
    console.log('[i] Copying sources...')
    fs.cpSync(path.join(packageDir, 'src'), outDir, { recursive: true })

    const printer = ts.createPrinter()

    for (const f of glob.sync(path.join(outDir, '**/*.ts'))) {
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
                    text: mod.slice(0, -3) + '.ts',
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
                '{ ' +
                'concat: (...args: any[]) => Uint8Array, ' +
                'from: (data: any, encoding?: string) => { toString(encoding?: string): string }, ' +
                ' }',
            SharedWorker: ['type', 'never'],
            process: '{ ' + 'hrtime: { bigint: () => bigint }, ' + '}',
        }

        for (const [name, decl_] of Object.entries(nodeSpecificApis)) {
            if (fileContent.includes(name)) {
                changed = true
                const isType = Array.isArray(decl_) && decl_[0] === 'type'
                const decl = isType ? decl_[1] : decl_

                if (isType) {
                    fileContent = `declare type ${name} = ${decl};\n` + fileContent
                } else {
                    fileContent = `declare const ${name}: ${decl};\n` + fileContent
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
}

console.log('[i] Copying misc files...')

const builtPkgJson = buildPackageJson()

if (buildConfig.buildCjs) {
    fs.writeFileSync(path.join(outDir, 'cjs/package.json'), JSON.stringify({ type: 'commonjs' }, null, 2))

    const CJS_DEPRECATION_WARNING = `
"use strict";
if (typeof globalThis !== 'undefined' && !globalThis._MTCUTE_CJS_DEPRECATION_WARNED) { 
    globalThis._MTCUTE_CJS_DEPRECATION_WARNED = true
    console.warn("[${builtPkgJson.name}] CommonJS support is deprecated and will be removed soon. Please consider switching to ESM, it's "+(new Date()).getFullYear()+" already.")
    console.warn("[${builtPkgJson.name}] Learn more about switching to ESM: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c")
}
`.trim()
    const entrypoints = []

    if (typeof builtPkgJson.exports === 'string') {
        entrypoints.push(builtPkgJson.exports)
    } else if (builtPkgJson.exports && typeof builtPkgJson.exports === 'object') {
        for (const entrypoint of Object.values(builtPkgJson.exports)) {
            entrypoints.push(entrypoint.require)
        }
    }

    for (const entry of entrypoints) {
        if (!entry.endsWith('.js')) continue
        transformFile(path.join(outDir, entry), (content) => `${CJS_DEPRECATION_WARNING}\n${content}`)
    }
}

if (IS_JSR) {
    // generate deno.json from package.json
    // https://jsr.io/docs/package-configuration

    const importMap = {}

    if (builtPkgJson.dependencies) {
        for (const [name, version] of Object.entries(builtPkgJson.dependencies)) {
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

    for (const [name, target] of Object.entries(builtPkgJson.exports)) {
        // jsr doesn't support wildcards, so we need to flatten those
        if (!name.includes('*')) continue

        if (!name.endsWith('*') || !target.endsWith('*')) {
            // for simplicity + it's the only one supported in some bundlers
            throw new Error(`Invalid wildcard in export map: ${name} -> ${target}`)
        }

        const base = name.slice(0, -1)
        const targetBase = target.slice(0, -1)

        for (const file of glob.sync(path.join(outDir, base, '**/*'))) {
            const newName = (base + path.relative(path.join(outDir, base), file)).replace(/\.ts$/, '.js')
            const newTarget = targetBase + path.relative(path.join(outDir, base), file)
            builtPkgJson.exports[newName] = newTarget
        }

        delete builtPkgJson.exports[name]
    }

    const denoJson = path.join(outDir, 'deno.json')
    fs.writeFileSync(
        denoJson,
        JSON.stringify(
            {
                name: builtPkgJson.name,
                version: builtPkgJson.version,
                exports: builtPkgJson.exports,
                exclude: ['**/*.test.ts', '**/*.test-utils.ts', '**/__fixtures__/**'],
                imports: importMap,
                ...builtPkgJson.denoJson,
            },
            null,
            2,
        ),
    )

    console.log('[i] Processing with slow-types-compiler...')
    const project = stc.createProject()
    stc.processPackage(project, denoJson)
    const unsavedSourceFiles = project.getSourceFiles().filter((s) => !s.isSaved())

    if (unsavedSourceFiles.length > 0) {
        console.log('[v] Changed %d files', unsavedSourceFiles.length)
        project.saveSync()
    }
}

try {
    fs.cpSync(path.join(packageDir, 'README.md'), path.join(outDir, 'README.md'))
} catch (e) {
    console.log('[!] Failed to copy README.md: ' + e.message)
}

fs.cpSync(path.join(__dirname, '../LICENSE'), path.join(outDir, 'LICENSE'))

if (!IS_JSR) {
    fs.writeFileSync(path.join(outDir, '.npmignore'), '*.tsbuildinfo\n')
}

Promise.resolve(buildConfig.final()).then(() => {
    if (IS_JSR) {
        console.log('[i] Trying to publish with --dry-run')
        exec('deno publish --dry-run --allow-dirty --quiet', { cwd: outDir })
        console.log('[v] All good!')
    } else {
        console.log('[v] Done!')
    }
})
