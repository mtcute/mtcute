const fs = require('fs')
const path = require('path')
const cp = require('child_process')

function publishSinglePackage(name) {
    let dir = path.join(__dirname, '../packages', name)

    if (name !== 'tl') {
        // tl package is already generated ready to publish

        console.log('[i] Building %s', name)
        // build ts
        cp.execSync('yarn run build', {
            cwd: dir,
            stdio: 'inherit',
        })

        // copy package.json, replacing private with false
        const packJson = JSON.parse(
            fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
        )
        if (!packJson.main)
            throw new Error(`${name}'s package.json does not contain "main"`)

        // since "src" is compiled to "dist", we need to remove that prefix
        packJson.main = packJson.main.replace(/^(?:\.\/)?src\//, '')
        packJson.private = false

        fs.writeFileSync(
            path.join(dir, 'dist/package.json'),
            JSON.stringify(packJson, null, 4)
        )

        // copy readme
        try {
            fs.copyFileSync(
                path.join(dir, 'README.md'),
                path.join(dir, 'dist/README.md')
            )
        } catch (e) {
            if (e.code !== 'ENOENT') throw e
        }

        dir = path.join(dir, 'dist')
    }

    console.log('[i] Publishing %s', name)

    // publish to npm
    // cp.execSync('npm publish', {
    //     cwd: ,
    // })
}

const LOCAL = [
    'crypto',
    'tl-reference'
]

if (require.main === module) {
    const arg = process.argv[2]
    if (!arg) {
        console.log('Usage: publish.js <package name | all>')
        process.exit(0)
    }

    if (arg === 'all') {
        for (const f of fs.readdirSync(path.join('../packages'))) {
            if (LOCAL.indexOf(f) > -1) continue

            publishSinglePackage(f)
        }
    } else {
        publishSinglePackage(arg)
    }
}
