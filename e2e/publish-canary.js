// this scripts publishes our e2e-tested builds to canary npm
// at this point, we should have all our packages installed in node_modules
// so it should be safe to just cd into them and run `npm publish` on them

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// setup token
const { NPM_TOKEN, REGISTRY, CURRENT_COMMIT } = process.env

if (!NPM_TOKEN || !REGISTRY || !CURRENT_COMMIT) {
    console.error('Missing NPM_TOKEN, REGISTRY or CURRENT_COMMIT env variables!')
    process.exit(1)
}

execSync(`npm config set //${REGISTRY.replace(/^https?:\/\//, '')}/:_authToken ${NPM_TOKEN}`, { stdio: 'inherit' })

const nodeModulesDir = path.join(__dirname, 'node_modules')
const mtcuteDir = path.join(nodeModulesDir, '@mtcute')

const commit = CURRENT_COMMIT.slice(0, 7)
const versions = {}

for (const pkg of fs.readdirSync(mtcuteDir)) {
    const pkgJsonPath = path.join(mtcuteDir, pkg, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
    const version = `${pkgJson.version}-git.${commit}`
    versions[pkg] = version
}

for (const pkg of fs.readdirSync(mtcuteDir)) {
    const pkgJsonPath = path.join(mtcuteDir, pkg, 'package.json')
    const pkgJsonOrig = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
    const pkgJson = JSON.parse(JSON.stringify(pkgJsonOrig))

    const version = versions[pkg]
    pkgJson.version = version

    // eslint-disable-next-line no-inner-declarations
    function fixDependencies(key) {
        if (!pkgJson[key]) return

        const deps = pkgJson[key]

        for (const dep of Object.keys(deps)) {
            if (!dep.startsWith('@mtcute/')) continue
            deps[dep] = versions[dep.slice('@mtcute/'.length)]
        }
    }

    fixDependencies('dependencies')
    fixDependencies('peerDependencies')
    fixDependencies('devDependencies')
    fixDependencies('optionalDependencies')

    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 4))

    execSync(`npm publish --registry ${REGISTRY} -q --tag canary`, {
        cwd: path.join(mtcuteDir, pkg),
        stdio: 'inherit',
    })

    // restore package.json just in case
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJsonOrig, null, 4))
}
