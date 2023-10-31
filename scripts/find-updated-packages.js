const cp = require('child_process')
const fs = require('fs')
const path = require('path')
const { listPackages } = require('./publish')

function getLatestTag() {
    try {
        const res = cp.execSync('git describe --abbrev=0 --tags', { encoding: 'utf8', stdio: 'pipe' }).trim()

        return res
    } catch (e) {
        if (e.stderr.match(/^fatal: (No names found|No tags can describe)/i)) {
            // no tags found, let's just return the first commit
            return cp.execSync('git rev-list --max-parents=0 HEAD', { encoding: 'utf8' }).trim()
        }

        throw e
    }
}

function findChangedFilesSince(tag, until = 'HEAD') {
    return cp.execSync(`git diff --name-only ${tag} ${until}`, { encoding: 'utf8', stdio: 'pipe' }).trim().split('\n')
}

getTsconfigFiles.cache = {}

function getTsconfigFiles(pkg) {
    if (!fs.existsSync(path.join(__dirname, `../packages/${pkg}/tsconfig.json`))) {
        throw new Error(`[!] ${pkg} does not have a tsconfig.json`)
    }
    if (pkg in getTsconfigFiles.cache) return getTsconfigFiles.cache[pkg]

    console.log('[i] Getting tsconfig files for %s', pkg)
    const res = cp.execSync('pnpm exec tsc --showConfig', {
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: path.join(__dirname, `../packages/${pkg}`),
    })

    const json = JSON.parse(res)

    return (getTsconfigFiles.cache[pkg] = json.files.map((it) => it.replace(/^\.\//, '')))
}

function isMeaningfulChange(pkg, path) {
    if (getTsconfigFiles(pkg).indexOf(path) > -1) return true

    // some magic heuristics stuff
    if (path.match(/\.md$/i)) return false
    if (path.match(/^\/(scripts|dist|tests|private)/i)) return false

    // to be safe
    return true
}

function findChangedPackagesSince(tag, until) {
    const packages = new Set(listPackages())
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

module.exports = { findChangedPackagesSince, getLatestTag }

if (require.main === module && process.env.CI && process.env.GITHUB_OUTPUT) {
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
        res = listPackages()
    } else if (input === 'updated') {
        const tag = getLatestTag()
        console.log('[i] Latest tag is %s', tag)

        res = findChangedPackagesSince(tag)
    } else {
        res = input.split(',')
    }

    console.log('[i] Will publish:', res)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `modified=${res.join(',')}${require('os').EOL}`)
}
