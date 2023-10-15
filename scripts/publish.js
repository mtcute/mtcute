const fs = require('fs')
const path = require('path')
const cp = require('child_process')

// const REGISTRY = 'https://registry.npmjs.org'
const REGISTRY = process.env.REGISTRY || 'https://npm.tei.su/'
exports.REGISTRY = REGISTRY

async function checkVersion(name, version) {
    return fetch(`${REGISTRY}@mtcute/${name}/${version}`).then((r) => r.status === 200)
}

async function publishSinglePackage(name) {
    let packageDir = path.join(__dirname, '../packages', name)

    console.log('[i] Building %s', name)

    // run build script
    cp.execSync('pnpm run build', {
        cwd: packageDir,
        stdio: 'inherit',
    })

    console.log('[i] Publishing %s', name)

    if (process.env.E2E) {
        const version = require(path.join(packageDir, 'dist/package.json')).version

        const exists = await checkVersion(name, version)

        if (exists) {
            console.log('[i] %s already exists, unpublishing..', name)
            cp.execSync(`npm unpublish --registry ${REGISTRY} --force @mtcute/${name}`, {
                cwd: path.join(packageDir, 'dist'),
                stdio: 'inherit',
            })
        }
    }

    // publish to npm
    cp.execSync(`npm publish --registry ${REGISTRY} --force`, {
        cwd: path.join(packageDir, 'dist'),
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

async function main(arg = process.argv[2]) {
    if (!arg) {
        console.log('Usage: publish.js <package name | all | updated>')
        process.exit(0)
    }

    console.log('[i] Using registry %s', REGISTRY)

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

            await publishSinglePackage(pkg)
        }
    } else {
        await publishSinglePackage(arg)
    }
}

exports.main = main

if (require.main === module) {
    main().catch((e) => {
        console.error(e)
        process.exit(1)
    })
}
