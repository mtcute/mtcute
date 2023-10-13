const fs = require('fs')
const path = require('path')
const cp = require('child_process')
const rimraf = require('rimraf')

// const REGISTRY = 'https://registry.npmjs.org'
const REGISTRY = 'https://npm.tei.su'
exports.REGISTRY = REGISTRY

async function checkVersion(name, version) {
    return fetch(`${REGISTRY}/@mtcute/${name}/${version}`).then((r) => r.status === 200)
}

function publishSinglePackage(name) {
    let packageDir = path.join(__dirname, '../packages', name)

    console.log('[i] Building %s', name)
    // cleanup dist folder
    rimraf.sync(path.join(packageDir, 'dist'))

    let outDir = path.join(packageDir, 'dist')

    if (name === 'tl') {
        // create package by copying all the needed files
        const files = [
            'binary/reader.d.ts',
            'binary/reader.js',
            'binary/rsa-keys.d.ts',
            'binary/rsa-keys.js',
            'binary/writer.d.ts',
            'binary/writer.js',
            'index.d.ts',
            'index.js',
            'raw-errors.json',
            'mtp-schema.json',
            'api-schema.json',
            'package.json',
            'README.md',
        ]

        fs.mkdirSync(path.join(packageDir, 'dist/binary'), { recursive: true })

        for (const f of files) {
            fs.copyFileSync(path.join(packageDir, f), path.join(packageDir, 'dist', f))
        }
    } else {
        // build ts
        cp.execSync('pnpm run build', {
            cwd: packageDir,
            stdio: 'inherit',
        })

        if (name === 'client') {
            // make TelegramClient a class, not an interface
            const dTsContent = fs.readFileSync(path.join(outDir, 'client.d.ts'), 'utf8')

            fs.writeFileSync(
                path.join(outDir, 'client.d.ts'),
                dTsContent.replace('export interface TelegramClient', 'export class TelegramClient'),
            )
        }

        if (name === 'crypto-node') {
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

            const nativeJs = fs.readFileSync(path.join(outDir, 'native.js'), 'utf8')

            fs.writeFileSync(path.join(outDir, 'native.js'), nativeJs.replace(/'\.\.\/build/g, "'./build"))
        }
    }

    console.log('[i] Publishing %s', name)

    // publish to npm
    cp.execSync('npm publish --registry https://npm.tei.su --force', {
        cwd: outDir,
        stdio: 'inherit',
    })
}

const LOCAL = ['crypto']

function listPackages() {
    const packages = []

    for (const f of fs.readdirSync(path.join(__dirname, '../packages'))) {
        if (LOCAL.indexOf(f) > -1) continue
        if (f[0] === '.') continue

        packages.push(f)
    }

    return packages
}

exports.listPackages = listPackages

async function main() {
    const arg = process.argv[2]

    if (!arg) {
        console.log('Usage: publish.js <package name | all | updated>')
        process.exit(0)
    }

    if (arg === 'all' || arg === 'updated') {
        for (const pkg of listPackages()) {
            if (arg === 'updated') {
                const pkgVersion = require(`../packages/${pkg}/package.json`).version
                const published = await checkVersion(pkg, pkgVersion)

                if (published) {
                    console.log('[i] %s is up to date', pkg)
                    continue
                }
            }

            publishSinglePackage(pkg)
        }
    } else {
        publishSinglePackage(arg)
    }
}

if (require.main === module) {
    main().catch((e) => {
        console.error(e)
        process.exit(1)
    })
}
