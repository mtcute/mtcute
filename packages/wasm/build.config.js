import * as fs from 'node:fs'
import { resolve } from 'node:path'

/** @type {import('@fuman/build/vite').CustomBuildConfig} */
export default () => ({
    preparePackageJson({ packageJson }) {
        packageJson.exports['./mtcute.wasm'] = './mtcute.wasm'
    },
    finalize({ packageDir, outDir }) {
        fs.cpSync(resolve(packageDir, 'src/mtcute.wasm'), resolve(outDir, 'mtcute.wasm'))
    },
})
