const cp = require('child_process')
const path = require('path')
const fs = require('fs')
const glob = require('glob')

if (process.argv.length < 3) {
    console.log('Usage: build-package.js <package name>')
    process.exit(0)
}

const packageDir = path.join(__dirname, '../packages', process.argv[2])
const outDir = path.join(packageDir, 'dist')

function exec(cmd, params) {
    cp.execSync(cmd, { cwd: packageDir, stdio: 'inherit', ...params })
}

function transformFile(file, transform) {
    const content = fs.readFileSync(file, 'utf8')
    fs.writeFileSync(file, transform(content))
}

const buildConfig = {
    buildTs: true,
    buildCjs: true,
    removeReferenceComments: true,
    replaceSrcImports: true,
    esmOnlyDirectives: false,
    before: () => {},
    final: () => {},
    ...(() => {
        let config

        try {
            config = require(path.join(packageDir, 'build.config.cjs'))
        } catch (e) {
            return {}
        }

        console.log('[i] Using custom build config')

        if (typeof config === 'function') {
            config = config({
                fs,
                path,
                exec,
                transformFile,
                packageDir,
                outDir,
            })
        }

        console.log(config)

        return config
    })(),
}

console.log(buildConfig)

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

    function replaceWorkspaceDependencies(field) {
        if (!pkgJson[field]) return

        const dependencies = pkgJson[field]

        for (const name of Object.keys(dependencies)) {
            const value = dependencies[name]

            if (value.startsWith('workspace:')) {
                if (value !== 'workspace:^') {
                    throw new Error(
                        `Cannot replace workspace dependency ${name} with ${value} - only workspace:^ is supported`,
                    )
                }
                if (!name.startsWith('@mtcute/')) {
                    throw new Error(`Cannot replace workspace dependency ${name} - only @mtcute/* is supported`)
                }

                const depVersion = require(path.join(packageDir, '..', name.slice(8), 'package.json')).version
                dependencies[name] = `^${depVersion}`
            }
        }
    }

    replaceWorkspaceDependencies('dependencies')
    replaceWorkspaceDependencies('devDependencies')
    replaceWorkspaceDependencies('peerDependencies')
    replaceWorkspaceDependencies('optionalDependencies')

    delete pkgJson.typedoc

    fs.writeFileSync(path.join(packageDir, 'dist/package.json'), JSON.stringify(pkgJson, null, 2))
}

// clean
fs.rmSync(path.join(outDir), { recursive: true, force: true })
fs.mkdirSync(path.join(outDir), { recursive: true })

buildConfig.before()

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

                fs.writeFileSync(f, content.replace(/@only-if-esm.*?@\/only-if-esm/gs, ''))
            }
        }

        let error = false

        try {
            exec('pnpm exec tsc --module commonjs --outDir dist/cjs', { cwd: packageDir, stdio: 'inherit' })
        } catch (e) {
            error = e
        }

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

if (buildConfig.buildCjs) {
    fs.writeFileSync(path.join(outDir, 'cjs/package.json'), JSON.stringify({ type: 'commonjs' }, null, 2))
}

buildPackageJson()

try {
    fs.cpSync(path.join(packageDir, 'README.md'), path.join(outDir, 'README.md'))
} catch (e) {
    console.log('[!] Failed to copy README.md: ' + e.message)
}

fs.cpSync(path.join(__dirname, '../LICENSE'), path.join(outDir, 'LICENSE'))

fs.writeFileSync(path.join(outDir, '.npmignore'), '*.tsbuildinfo\n')

buildConfig.final()

console.log('[v] Done!')
