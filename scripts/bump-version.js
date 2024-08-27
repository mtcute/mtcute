import { appendFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { EOL } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { inc, rcompare } from 'semver'

const __dirname = dirname(new URL(import.meta.url).pathname)

function collectPackageJsons() {
    return readdirSync(join(__dirname, '../packages'))
        .filter(s => !s.startsWith('.'))
        .map((name) => {
            try {
                return JSON.parse(readFileSync(join(__dirname, '../packages', name, 'package.json'), 'utf-8'))
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
        .filter(it => it.name !== '@mtcute/tl')
        .map(it => it.version)
        .sort(rcompare)[0]

    const nextVersion = inc(maxVersion, kind)
    console.log('[i] Bumping versions to %s', nextVersion)

    for (const pkg of packages) {
        if (pkg === 'tl') continue // own versioning
        const pkgJson = pkgJsons.find(it => it.name === `@mtcute/${pkg}`)

        if (!pkgJson) {
            console.error(`Package ${pkg} not found!`)
            process.exit(1)
        }

        pkgJson.version = nextVersion
        writeFileSync(
            join(__dirname, '../packages', pkg, 'package.json'),
            `${JSON.stringify(pkgJson, null, 2)}\n`,
        )
    }

    const rootPkgJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'))
    rootPkgJson.version = nextVersion
    writeFileSync(join(__dirname, '../package.json'), `${JSON.stringify(rootPkgJson, null, 2)}\n`)

    return nextVersion
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
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
        appendFileSync(process.env.GITHUB_OUTPUT, `version=${ver}${EOL}`)
    }
}

export { bumpVersions }
