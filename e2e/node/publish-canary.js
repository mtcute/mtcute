// this scripts publishes our e2e-tested builds to canary npm
// at this point, we should have all our packages installed in verdaccio
// so it should be safe to just pull them and run `npm publish` on them

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// setup tokenw
const { NPM_TOKEN, REGISTRY, CURRENT_COMMIT } = process.env

if (!NPM_TOKEN || !REGISTRY || !CURRENT_COMMIT) {
    console.error('Missing NPM_TOKEN, REGISTRY or CURRENT_COMMIT env variables!')
    process.exit(1)
}

execSync(`npm config set //${REGISTRY.replace(/^https?:\/\//, '')}/:_authToken ${NPM_TOKEN}`, { stdio: 'inherit' })
const commit = CURRENT_COMMIT.slice(0, 7)

const myPkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
const packages = Object.keys(myPkgJson.dependencies)
    .filter((x) => x.startsWith('@mtcute/'))
    .map((x) => x.slice('@mtcute/'.length))

const workDir = path.join(__dirname, 'temp')
fs.mkdirSync(workDir, { recursive: true })

async function main() {
    const versions = {}

    function fixDependencies(pkgJson, key) {
        if (!pkgJson[key]) return

        const deps = pkgJson[key]

        for (const dep of Object.keys(deps)) {
            if (!dep.startsWith('@mtcute/')) continue
            deps[dep] = versions[dep.slice('@mtcute/'.length)]
        }
    }

    // prepare working directory
    for (const pkg of packages) {
        const data = await fetch(`http://localhost:4873/@mtcute/${pkg}`).then((x) => x.json())
        const version = data['dist-tags'].latest
        const tarball = data.versions[version].dist.tarball

        execSync(`wget -O ${pkg}.tgz ${tarball}`, { cwd: workDir, stdio: 'inherit' })
        execSync(`tar -xzf ${pkg}.tgz`, { cwd: workDir, stdio: 'inherit' })
        execSync(`rm ${pkg}.tgz`, { cwd: workDir, stdio: 'inherit' })
        execSync(`mv package ${pkg}`, { cwd: workDir, stdio: 'inherit' })

        versions[pkg] = `${version}-git.${commit}`
    }

    for (const pkg of packages) {
        const pkgDir = path.join(workDir, pkg)

        const pkgJsonPath = path.join(pkgDir, 'package.json')
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))

        fixDependencies(pkgJson, 'dependencies')
        fixDependencies(pkgJson, 'peerDependencies')
        fixDependencies(pkgJson, 'devDependencies')
        fixDependencies(pkgJson, 'optionalDependencies')
        pkgJson.version = versions[pkg]

        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 4))

        execSync(`npm publish --registry ${REGISTRY} -q --tag canary`, {
            cwd: pkgDir,
            stdio: 'inherit',
        })
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
