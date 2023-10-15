/* eslint-disable no-console,no-restricted-globals */
const glob = require('glob')
const cp = require('child_process')
const path = require('path')

const env = {}
require('dotenv').config({ processEnv: env })

const config = require('./config')

const DIRS = Object.keys(config)

function runForFile(dir, file, single = true) {
    const { runFile, beforeAll } = config[dir]

    if (!runFile) {
        console.log('No runFile for %s', dir)

        return
    }

    let cmds = runFile(file)

    const options = {
        env: {
            ...env,
            ...process.env,
        },
        cwd: path.join(__dirname, dir),
        stdio: 'inherit',
    }

    if (!Array.isArray(cmds)) {
        cmds = [cmds]
    }

    if (beforeAll && single) {
        cmds.unshift(...beforeAll())
    }

    for (const c of cmds) {
        console.log('%s $ %s', dir, c)
        cp.execSync('pnpm exec ' + c, options)
    }
}

function runForDir(dir) {
    const { getFiles, beforeAll } = config[dir]

    if (!getFiles) {
        console.log('No getFiles for %s', dir)

        return
    }

    const options = {
        env: {
            ...env,
            ...process.env,
        },
        cwd: path.join(__dirname, dir),
        stdio: 'inherit',
    }

    if (beforeAll) {
        for (const c of beforeAll()) {
            console.log('%s $ %s', dir, c)
            cp.execSync('pnpm exec ' + c, options)
        }
    }

    const files = glob.sync(getFiles(), { cwd: path.join(__dirname, dir) })

    for (const file of files) {
        runForFile(dir, file, false)
    }
}

async function main() {
    if (!process.argv[2]) {
        console.log('Usage: node runner.js <what>')
        console.log('  where <what> is one of:')
        console.log('    all - run all tests')
        console.log('    <dirname> - (one of %s) - run tests for that directory', DIRS.join(', '))
        console.log('    <dirname> <filename> - run tests for that file')
        process.exit(1)
    }

    const [dir, file] = process.argv.slice(2)

    if (dir === 'all') {
        for (const d of DIRS) {
            console.log('Entering %s', d)
            runForDir(d)
        }

        return
    }

    if (!DIRS.includes(dir)) {
        console.log('Unknown directory %s', dir)
        process.exit(1)
    }

    if (file) {
        const files = glob.sync(config[dir].getFiles(), { cwd: path.join(__dirname, dir) })
        const matchingFile = files.find((f) => f.endsWith(file))

        if (!matchingFile) {
            console.log("Can't find file %s", file)
            process.exit(1)
        }

        runForFile(dir, matchingFile)
    } else {
        runForDir(dir)
    }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
