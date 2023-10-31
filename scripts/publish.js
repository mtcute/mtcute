const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const REGISTRY = process.env.REGISTRY || 'https://registry.npmjs.org'
exports.REGISTRY = REGISTRY

async function checkVersion(name, version, retry = 0) {
    return fetch(`${REGISTRY}@mtcute/${name}/${version}`)
        .then((r) => r.status === 200)
        .catch((err) => {
            if (retry >= 5) throw err

            // for whatever reason this request sometimes fails with ECONNRESET
            // no idea why, probably some issue in orbstack networking
            console.log('[i] Error checking version:')
            console.log(err)

            return new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
                checkVersion(name, version, retry + 1),
            )
        })
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
    cp.execSync(`npm publish --registry ${REGISTRY} --force -q`, {
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

    const published = []

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
            published.push(pkg)
        }
    } else {
        for (const pkg of arg.split(',')) {
            await publishSinglePackage(pkg)
            published.push(pkg)
        }
    }

    if (process.env.GH_RELEASE) {
        // we should also generate tgz files for all published packages
        // for a github release, and also generate a title
        const tarballs = []

        for (const pkg of published) {
            const dir = path.join(__dirname, '../packages', pkg, 'dist')
            const tar = cp.execSync('npm pack -q', { cwd: dir })
            tarballs.push(path.join(dir, tar.toString().trim()))
        }

        fs.writeFileSync(process.env.GITHUB_OUTPUT, `tarballs=${tarballs.join(',')}\n`, { flag: 'a' })
    }
}

exports.main = main

if (require.main === module) {
    main().catch((e) => {
        console.error(e)
        process.exit(1)
    })
}
