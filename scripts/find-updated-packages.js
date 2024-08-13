import { execSync } from 'node:child_process'
import { appendFileSync, existsSync } from 'node:fs'
import { EOL } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { findChangedFilesSince, getLatestTag } from './git-utils.js'
import { listPackages } from './publish.js'

getTsconfigFiles.cache = {}

const __dirname = dirname(new URL(import.meta.url).pathname)

function getTsconfigFiles(pkg) {
    if (!existsSync(join(__dirname, `../packages/${pkg}/tsconfig.json`))) {
        throw new Error(`[!] ${pkg} does not have a tsconfig.json`)
    }
    if (pkg in getTsconfigFiles.cache) return getTsconfigFiles.cache[pkg]

    console.log('[i] Getting tsconfig files for %s', pkg)
    const res = execSync('pnpm exec tsc --showConfig', {
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: join(__dirname, `../packages/${pkg}`),
    })

    const json = JSON.parse(res)

    return (getTsconfigFiles.cache[pkg] = json.files.map(it => it.replace(/^\.\//, '')))
}

function isMeaningfulChange(pkg, path) {
    // some magic heuristics stuff

    if (path.match(/\.(md|test(?:-utils)?\.ts)$/i)) return false

    if (getTsconfigFiles(pkg).includes(path)) {
        console.log('[i] %s: %s is in tsconfig', pkg, path)

        return true
    }

    if (path.match(/typedoc\.cjs$/i)) return false
    if (path.match(/^(scripts|dist|tests|private)\//i)) return false

    console.log('[i] %s: %s is a meaningful change', pkg, path)

    // to be safe
    return true
}

function findChangedPackagesSince(tag, until) {
    const packages = new Set(listPackages(true))
    const changedFiles = findChangedFilesSince(tag, until)

    const changedPackages = new Set()

    for (const file of changedFiles) {
        const [dir, pkgname, ...rest] = file.split('/')
        if (dir !== 'packages') continue
        if (!packages.has(pkgname)) continue

        // already checked, no need to check again
        if (changedPackages.has(pkgname)) continue

        const relpath = rest.join('/')

        if (isMeaningfulChange(pkgname, relpath)) {
            changedPackages.add(pkgname)
        }
    }

    return Array.from(changedPackages)
}

export { findChangedPackagesSince, getLatestTag }

if (process.argv[1] === fileURLToPath(import.meta.url) && process.env.CI && process.env.GITHUB_OUTPUT) {
    const kind = process.argv[2]
    const input = process.argv[3]

    if (!input) {
        // for simpler flow, one can pass all or package list as the first argument,
        // and they will be returned as is, so that we can later simply
        // use the outputs of this script
        console.log('Usage: find-updated-packages.js <packages>')
        process.exit(1)
    }

    if (kind === 'major' && input !== 'all') {
        throw new Error('For major releases, all packages must be published')
    }

    console.log('[i] Determining packages to publish...')

    let res

    if (input === 'all') {
        res = listPackages(true)
    } else if (input === 'updated') {
        const tag = getLatestTag()
        console.log('[i] Latest tag is %s', tag)

        res = findChangedPackagesSince(tag)
    } else {
        res = input.split(',')
    }

    console.log('[i] Will publish:', res)
    appendFileSync(process.env.GITHUB_OUTPUT, `modified=${res.join(',')}${EOL}`)
}
