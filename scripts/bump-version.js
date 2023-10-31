const fs = require('fs')
const path = require('path')
const semver = require('semver')

function collectPackageJsons() {
    return fs
        .readdirSync(path.join(__dirname, '../packages'))
        .filter((s) => !s.startsWith('.'))
        .map((name) => {
            try {
                return JSON.parse(fs.readFileSync(path.join(__dirname, '../packages', name, 'package.json'), 'utf-8'))
            } catch (e) {
                if (e.code !== 'ENOENT') throw e

                return null
            }
        })
        .filter(Boolean)
}

function bumpVersions(packages, kind) {
    const pkgJsons = collectPackageJsons()
    const maxVersion = pkgJsons
        .filter((it) => it.name !== '@mtcute/tl')
        .map((it) => it.version)
        .sort(semver.rcompare)[0]

    const nextVersion = semver.inc(maxVersion, kind)
    console.log('[i] Bumping versions to %s', nextVersion)

    for (const pkg of packages) {
        const pkgJson = pkgJsons.find((it) => it.name === `@mtcute/${pkg}`)

        if (!pkgJson) {
            console.error(`Package ${pkg} not found!`)
            process.exit(1)
        }

        pkgJson.version = nextVersion
        fs.writeFileSync(
            path.join(__dirname, '../packages', pkg, 'package.json'),
            JSON.stringify(pkgJson, null, 4) + '\n',
        )
    }

    return nextVersion
}

if (require.main === module) {
    const kind = process.argv[2]
    const packages = process.argv[3]

    if (!packages || !kind) {
        console.log('Usage: bump-version.js <major|minor|patch> <package1,package2>')
        process.exit(1)
    }

    const packagesList = packages.split(',')

    if (packagesList.length === 0) {
        console.error('No packages specified!')
        process.exit(1)
    }

    if (kind === 'major' && packagesList.length !== collectPackageJsons().length) {
        console.error('Cannot bump major version only for some packages!')
        process.exit(1)
    }

    const ver = bumpVersions(packagesList, kind)

    if (process.env.GITHUB_OUTPUT) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${ver}${require('os').EOL}`)
    }
}

module.exports = { bumpVersions }
