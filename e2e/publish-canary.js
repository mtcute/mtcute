// this scripts publishes our e2e-tested builds to canary npm
// at this point, we should have all our packages installed in node_modules
// so it should be safe to just cd into them and run `npm publish` on them

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// setup token
const { NPM_TOKEN, REGISTRY, CURRENT_COMMIT } = process.env

if (!NPM_TOKEN) {
    console.error('NPM_TOKEN is not set!')
    process.exit(1)
}

execSync(`npm config set //${REGISTRY.replace(/^https?:\/\//, '')}/:_authToken ${NPM_TOKEN}`, { stdio: 'inherit' })

const nodeModulesDir = path.join(__dirname, 'node_modules')
const mtcuteDir = path.join(nodeModulesDir, '@mtcute')

const commit = CURRENT_COMMIT.slice(0, 7)

for (const pkg of fs.readdirSync(mtcuteDir)) {
    const pkgJsonPath = path.join(mtcuteDir, pkg, 'package.json')
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
    const version = `${pkgJson.version}-git.${commit}`

    fs.writeFileSync(
        pkgJsonPath,
        JSON.stringify(
            {
                ...pkgJson,
                version,
            },
            null,
            4,
        ),
    )

    execSync(`npm publish --registry ${REGISTRY} -q --tag canary`, {
        cwd: path.join(mtcuteDir, pkg),
        stdio: 'inherit',
    })

    // restore package.json just in case
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 4))
}
