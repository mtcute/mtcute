const cp = require('child_process')
const path = require('path')
const fs = require('fs')
const glob = require('glob')

if (process.argv.length < 3) {
    console.log('Usage: build-package.js <package name>')
    process.exit(0)
}

const packageDir = path.join(__dirname, '../packages', process.argv[2])
const buildConfig = {
    tl: { buildTs: false, buildCjs: false },
}[process.argv[2]] ?? {
    buildTs: true,
    buildCjs: true,
    removeReferenceComments: true,
    replaceSrcImports: true,
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
    fs.writeFileSync(path.join(packageDir, 'dist/package.json'), JSON.stringify(pkgJson, null, 2))

    function replaceWorkspaceDependencies(field) {
        if (pkgJson[field]) {
            const dependencies = pkgJson[field]

            for (const name of Object.keys(dependencies)) {
                const value = dependencies[name]

                if (value.startsWith('workspace:')) {
                    dependencies[name] = value.replace('workspace:', '')
                }
            }
        }
    }

    replaceWorkspaceDependencies('dependencies')
    replaceWorkspaceDependencies('devDependencies')
    replaceWorkspaceDependencies('peerDependencies')
    replaceWorkspaceDependencies('optionalDependencies')
}

function exec(cmd) {
    cp.execSync(cmd, { cwd: packageDir, stdio: 'inherit' })
}

const outDir = path.join(packageDir, 'dist')

// clean
fs.rmSync(path.join(outDir, 'dist'), { recursive: true, force: true })

if (buildConfig.buildTs) {
    exec('pnpm exec tsc --build', { cwd: packageDir, stdio: 'inherit' })

    if (buildConfig.buildCjs) {
        exec('pnpm exec tsc --module commonjs --outDir dist/cjs', { cwd: packageDir, stdio: 'inherit' })
    }

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

fs.writeFileSync(path.join(packageDir, 'dist/cjs/package.json'), JSON.stringify({ type: 'commonjs' }, null, 2))

buildPackageJson()
fs.cpSync(path.join(packageDir, 'README.md'), path.join(packageDir, 'dist/README.md'))
