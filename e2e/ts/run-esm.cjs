const cp = require('child_process')

const { fixForEsm } = require('./build-esm.cjs')

const file = process.argv[2]

if (!file) {
    console.error('Usage: run-esm.cjs <file>')
    process.exit(1)
}

let error = null
const restore = fixForEsm()

try {
    cp.execSync(`pnpm exec mocha --config=mocha.esm.json ${file}`, { stdio: 'inherit' })
} catch (e) {
    error = e
}

restore()

if (error) {
    throw error
}
