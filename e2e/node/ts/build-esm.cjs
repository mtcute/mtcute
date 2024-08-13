const fs = require('node:fs')
const path = require('node:path')
const cp = require('node:child_process')

const glob = require('glob')

function fixForEsm() {
    const modified = {}

    fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify({ type: 'module' }))

    for (const file of glob.sync('tests/**/*.ts')) {
        let content = fs.readFileSync(file, 'utf8')

        if (content.includes('@fix-import')) {
            modified[file] = content
            content = content.replace(/(?<=@fix-import\nimport.*?')(.*?)(?='$)/gms, '$1.js')
            fs.writeFileSync(file, content)
        }
    }

    return () => {
        fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify({ type: 'commonjs' }))

        for (const file of Object.keys(modified)) {
            fs.writeFileSync(file, modified[file])
        }
    }
}
exports.fixForEsm = fixForEsm

function main() {
    const restore = fixForEsm()
    let error = null

    try {
        cp.execSync('pnpm exec tsc --outDir dist/esm', { stdio: 'inherit' })
        fs.writeFileSync(path.join(__dirname, 'dist/esm/package.json'), JSON.stringify({ type: 'module' }))
    } catch (e) {
        error = e
    }

    restore()

    if (error) {
        throw error
    }
}

if (require.main === module) {
    main()
}
