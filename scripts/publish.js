const fs = require('fs')
const path = require('path')
const glob = require('glob')
const cp = require('child_process')
const rimraf = require('rimraf')

function publishSinglePackage(name) {
    let dir = path.join(__dirname, '../packages', name)

    console.log('[i] Building %s', name)
    // cleanup dist folder
    rimraf.sync(path.join(dir, 'dist'))

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

        fs.mkdirSync(path.join(dir, 'dist/binary'), { recursive: true })

        for (const f of files) {
            fs.copyFileSync(path.join(dir, f), path.join(dir, 'dist', f))
        }
    } else {
        // build ts
        cp.execSync(
            'pnpm run build',
            {
                cwd: dir,
                stdio: 'inherit',
            },
        )

        // remove reference comments
        for (const f of glob.sync(path.join(dir, 'dist/**/*.d.ts'))) {
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

        // replace /src/ imports
        for (const f of glob.sync(path.join(dir, 'dist/**/*.js'))) {
            let content = fs.readFileSync(f, 'utf8')
            let changed = false

            if (content.match(/@mtcute\/[a-z-]+\/src/)) {
                changed = true
                content = content.replace(/(@mtcute\/[a-z-]+)\/src/g, '$1')
            }

            if (changed) fs.writeFileSync(f, content)
        }

        if (name === 'client') {
            // // make TelegramClient a class, not an interface
            // const dTsContent = fs.readFileSync(
            //     path.join(dir, 'dist/client.d.ts'),
            //     'utf8'
            // )
            //
            // fs.writeFileSync(
            //     path.join(dir, 'dist/client.d.ts'),
            //     dTsContent.replace(
            //         'export interface TelegramClient',
            //         'export class TelegramClient'
            //     )
            // )

            // make methods prototype methods, not properties
            let jsContent = fs.readFileSync(
                path.join(dir, 'dist/client.js'),
                'utf8',
            )

            let methods = []
            jsContent = jsContent.replace(
                /^\s*this\.([a-zA-Z0-9_]+) = ([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+);\r?\n/gm,
                (_, name, imported) => {
                    methods.push(
                        `TelegramClient.prototype.${name} = ${imported};`,
                    )

                    return ''
                },
            )

            const idx = jsContent.indexOf(
                'exports.TelegramClient = TelegramClient;',
            )

            if (idx === -1) { throw new Error('client.js exports.TelegramClient not found') }

            jsContent =
                jsContent.substring(0, idx) +
                methods.join('\n') +
                '\n' +
                jsContent.substring(idx)

            fs.writeFileSync(path.join(dir, 'dist/client.js'), jsContent)
        }

        if (name === 'crypto-node') {
            // copy native sources and binding.gyp file

            fs.mkdirSync(path.join(dir, 'dist/lib'), { recursive: true })
            fs.mkdirSync(path.join(dir, 'dist/crypto'), { recursive: true })

            const bindingGyp = fs.readFileSync(
                path.join(dir, 'binding.gyp'),
                'utf8',
            )
            fs.writeFileSync(
                path.join(dir, 'dist/binding.gyp'),
                bindingGyp
                    // replace paths to crypto
                    .replace(/"\.\.\/crypto/g, '"crypto'),
            )

            for (const f of fs.readdirSync(path.join(dir, 'lib'))) {
                const content = fs.readFileSync(
                    path.join(dir, 'lib', f),
                    'utf8',
                )

                fs.writeFileSync(
                    path.join(dir, 'dist/lib', f),
                    content
                        // replace paths to crypto
                        .replace(
                            /#include "\.\.\/\.\.\/crypto/g,
                            '#include "../crypto',
                        ),
                )
            }

            for (const f of fs.readdirSync(path.join(dir, '../crypto'))) {
                fs.copyFileSync(
                    path.join(dir, '../crypto', f),
                    path.join(dir, 'dist/crypto', f),
                )
            }

            const nativeJs = fs.readFileSync(
                path.join(dir, 'dist/native.js'),
                'utf8',
            )

            fs.writeFileSync(
                path.join(dir, 'dist/native.js'),
                nativeJs.replace(/'\.\.\/build/g, "'./build"),
            )
        }
    }

    // copy package.json, replacing private with false
    const packJson = JSON.parse(
        fs.readFileSync(path.join(dir, 'package.json'), 'utf8'),
    )

    if (!packJson.main) { throw new Error(`${name}'s package.json does not contain "main"`) }

    // since "src" is compiled to "dist", we need to remove that prefix
    packJson.main = packJson.main
        .replace(/^(?:\.\/)?src\//, '')
        .replace(/\.ts$/, '.js')
    packJson.private = false

    function replaceWorkspaceDependencies(field) {
        if (packJson[field]) {
            const dependencies = packJson[field]

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

    fs.writeFileSync(
        path.join(dir, 'dist/package.json'),
        JSON.stringify(packJson, null, 4),
    )

    // copy tsconfig
    try {
        fs.copyFileSync(
            path.join(__dirname, '../tsconfig.json'),
            path.join(dir, 'dist/tsconfig.json'),
        )
    } catch (e) {
        if (e.code !== 'ENOENT') throw e
    }

    // copy readme
    try {
        fs.copyFileSync(
            path.join(dir, 'README.md'),
            path.join(dir, 'dist/README.md'),
        )
    } catch (e) {
        if (e.code !== 'ENOENT') throw e
    }

    dir = path.join(dir, 'dist')

    console.log('[i] Publishing %s', name)

    // publish to npm
    cp.execSync('npm publish', {
        cwd: dir,
        stdio: 'inherit',
    })
}

const LOCAL = ['crypto']

if (require.main === module) {
    const arg = process.argv[2]

    if (!arg) {
        console.log('Usage: publish.js <package name | all>')
        process.exit(0)
    }

    if (arg === 'all') {
        for (const f of fs.readdirSync(path.join(__dirname, '../packages'))) {
            if (LOCAL.indexOf(f) > -1) continue
            if (f[0] === '.') continue

            publishSinglePackage(f)
        }
    } else {
        publishSinglePackage(arg)
    }
}
