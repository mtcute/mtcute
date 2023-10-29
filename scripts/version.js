const fs = require('fs')
const path = require('path')
const semver = require('semver')
const cp = require('child_process')

function bumpVersion(packageName, version) {
    const packageJsons = fs
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
    const packageJsonChanged = new Set()

    // i am pretty fucking sure there is a better way to do this, but whatever
    // im tired as fuck and hadnt had sleep for a while

    const newVersions = { [packageName]: version }
    let hadChanges = true

    while (hadChanges) {
        hadChanges = false

        packageJsons.forEach((json) => {
            if (!json.name.startsWith('@mtcute/')) return
            const pkgName = json.name.slice(8)

            function check(deps) {
                if (!deps) return

                Object.keys(deps).forEach((depName) => {
                    if (!depName.startsWith('@mtcute/')) return

                    const depVersionRange = deps[depName].replace(/^workspace:/, '')
                    depName = depName.slice(8)

                    if (
                        newVersions[depName] &&
                        !newVersions[pkgName] &&
                        !semver.satisfies(newVersions[depName], depVersionRange)
                    ) {
                        newVersions[pkgName] = semver.inc(json.version, 'patch')
                        hadChanges = true
                    }
                })
            }

            check(json.dependencies)
            check(json.devDependencies)
            check(json.peerDependencies)
            check(json.optionalDependencies)
        })
    }

    Object.keys(newVersions).forEach((pkgName) => {
        packageJsonChanged.add(pkgName)

        const version = newVersions[pkgName]
        console.log(`updated ${pkgName} to ${version}`)

        for (const json of packageJsons) {
            if (json.name === `@mtcute/${pkgName}`) continue

            const updateDependencies = (obj) => {
                if (!obj) return
                Object.keys(obj).forEach((depName) => {
                    if (!depName.startsWith('@mtcute/')) return

                    const depVersionRange = obj[depName].replace(/^workspace:/, '')
                    depName = depName.slice(8)

                    if (depName === pkgName && !semver.satisfies(version, depVersionRange)) {
                        obj[`@mtcute/${depName}`] = `workspace:^${version}`
                        console.log(` - updated dependency ${depName} at ${json.name}`)
                        packageJsonChanged.add(json.name.slice(8))
                    }
                })
            }

            updateDependencies(json.dependencies)
            updateDependencies(json.devDependencies)
            updateDependencies(json.peerDependencies)
            updateDependencies(json.optionalDependencies)
        }
    })

    console.log('changed package.json in:', packageJsonChanged)

    packageJsonChanged.forEach((name) => {
        const json = packageJsons.find((json) => json.name === `@mtcute/${name}`)
        if (!json) return

        fs.writeFileSync(path.join(__dirname, '../packages', name, 'package.json'), JSON.stringify(json, null, 4))
    })

    console.log('Done!')
    // because i am fucking dumb and have adhd and always forget it lol
    // console.log('Now run `pnpm i` and make sure everything compiles.')
    // i kept forgetting that so yea
    cp.execSync('pnpm -w install', { stdio: 'inherit' })
}

if (require.main === module) {
    const packageName = process.argv[2]
    const version = process.argv[3]

    if (!packageName || !version) {
        console.log('Usage: version.js <packageName> <version>')
        process.exit(0)
    }

    bumpVersion(packageName, version)
}

module.exports = { bumpVersion }
