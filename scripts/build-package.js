/* eslint-disable no-restricted-globals */
const cp = require('child_process')
const path = require('path')
const fs = require('fs')
const glob = require('glob')

if (process.argv.length < 3) {
    console.log('Usage: build-package.js <package name>')
    process.exit(0)
}

const packageDir = path.join(__dirname, '../packages', process.argv[2])
const BUILD_CONFIGS = {
    tl: { buildTs: false, buildCjs: false },
    core: {
        esmOnlyDirectives: true,
        customScript(packageDir, outDir) {
            const version = require(path.join(packageDir, 'package.json')).version
            const replaceVersion = (content) => content.replace('%VERSION%', version)

            transformFile(
                path.join(outDir, 'cjs/network/network-manager.js'),
                replaceVersion,
            )
            transformFile(
                path.join(outDir, 'esm/network/network-manager.js'),
                replaceVersion,
            )
        },
    },
    client: { esmOnlyDirectives: true },
    'crypto-node': {
        customScript(packageDir, outDir) {
            // copy native sources and binding.gyp file

            fs.mkdirSync(path.join(outDir, 'lib'), { recursive: true })
            fs.mkdirSync(path.join(outDir, 'crypto'), { recursive: true })

            const bindingGyp = fs.readFileSync(path.join(packageDir, 'binding.gyp'), 'utf8')
            fs.writeFileSync(
                path.join(outDir, 'binding.gyp'),
                bindingGyp
                    // replace paths to crypto
                    .replace(/"\.\.\/crypto/g, '"crypto'),
            )

            for (const f of fs.readdirSync(path.join(packageDir, 'lib'))) {
                const content = fs.readFileSync(path.join(packageDir, 'lib', f), 'utf8')

                fs.writeFileSync(
                    path.join(outDir, 'lib', f),
                    content
                        // replace paths to crypto
                        .replace(/#include "\.\.\/\.\.\/crypto/g, '#include "../crypto'),
                )
            }

            for (const f of fs.readdirSync(path.join(packageDir, '../crypto'))) {
                fs.copyFileSync(path.join(packageDir, '../crypto', f), path.join(outDir, 'crypto', f))
            }

            // for some unknown fucking reason ts doesn't do this
            fs.copyFileSync(path.join(packageDir, 'src/native.cjs'), path.join(outDir, 'cjs/native.cjs'))
            fs.copyFileSync(path.join(packageDir, 'src/native.cjs'), path.join(outDir, 'esm/native.cjs'))
        },
    },
}

const buildConfig = {
    buildTs: true,
    buildCjs: true,
    removeReferenceComments: true,
    replaceSrcImports: true,
    esmOnlyDirectives: false,
    customScript: () => {},
    ...BUILD_CONFIGS[process.argv[2]],
}

function buildPackageJson() {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf-8'))
    pkgJson.main = 'cjs/index.js'
    pkgJson.module = 'esm/index.js'
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

    function replaceWorkspaceDependencies(field) {
        if (!pkgJson[field]) return

        const dependencies = pkgJson[field]

        for (const name of Object.keys(dependencies)) {
            const value = dependencies[name]

            if (value.startsWith('workspace:')) {
                dependencies[name] = value.replace('workspace:', '')
            }
        }
    }

    replaceWorkspaceDependencies('dependencies')
    replaceWorkspaceDependencies('devDependencies')
    replaceWorkspaceDependencies('peerDependencies')
    replaceWorkspaceDependencies('optionalDependencies')

    fs.writeFileSync(path.join(packageDir, 'dist/package.json'), JSON.stringify(pkgJson, null, 2))
}

function exec(cmd) {
    cp.execSync(cmd, { cwd: packageDir, stdio: 'inherit' })
}

function transformFile(file, transform) {
    const content = fs.readFileSync(file, 'utf8')
    fs.writeFileSync(file, transform(content))
}

const outDir = path.join(packageDir, 'dist')

// clean
fs.rmSync(path.join(outDir), { recursive: true, force: true })

if (buildConfig.buildTs) {
    console.log('[i] Building typescript...')
    exec('pnpm exec tsc --build', { cwd: packageDir, stdio: 'inherit' })

    if (buildConfig.buildCjs) {
        console.log('[i] Building typescript (CJS)...')
        const originalFiles = {}

        if (buildConfig.esmOnlyDirectives) {
            for (const f of glob.sync(path.join(packageDir, '**/*.ts'))) {
                const content = fs.readFileSync(f, 'utf8')
                if (!content.includes('@only-if-esm')) continue
                originalFiles[f] = content

                fs.writeFileSync(f, content.replace(
                    /@only-if-esm.*?@\/only-if-esm/gs,
                    '',
                ))
            }
        }

        let error = false

        try {
            exec('pnpm exec tsc --module commonjs --outDir dist/cjs', { cwd: packageDir, stdio: 'inherit' })
        } catch (e) { error = e }

        for (const f of Object.keys(originalFiles)) {
            fs.writeFileSync(f, originalFiles[f])
        }

        if (error) throw error
    }

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
}

console.log('[i] Copying files...')
fs.writeFileSync(path.join(packageDir, 'dist/cjs/package.json'), JSON.stringify({ type: 'commonjs' }, null, 2))

buildPackageJson()

try {
    fs.cpSync(path.join(packageDir, 'README.md'), path.join(packageDir, 'dist/README.md'))
} catch (e) {
    console.log('[!] Failed to copy README.md: ' + e.message)
}

buildConfig.customScript(packageDir, outDir)

console.log('[v] Done!')
