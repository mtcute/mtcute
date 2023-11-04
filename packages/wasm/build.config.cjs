// /* eslint-disable no-console */
// import *  cp from 'child_process'
// import * as fs from 'fs'
// import { join } from 'path'

// const root = new URL('.', import.meta.url).pathname

module.exports = ({ path: { join }, fs, outDir, packageDir, transformFile }) => ({
    esmOnlyDirectives: true,
    final() {
        const fixWasmPath = (path) => {
            transformFile(join(outDir, path), (data) => data.replace('../lib/mtcute.wasm', '../mtcute.wasm'))
        }

        fixWasmPath('cjs/init.js')
        fixWasmPath('esm/init.js')

        fs.cpSync(join(packageDir, 'lib/mtcute.wasm'), join(outDir, 'mtcute.wasm'))
    },
})
