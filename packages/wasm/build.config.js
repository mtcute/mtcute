import * as fs from 'node:fs'
import { resolve } from 'node:path'

/** @type {import('@fuman/build/vite').CustomBuildConfig} */
export default () => {
    return {
        pluginsPre: [
            {
                name: 'remove-vite-ignore',
                renderChunk(code) {
                    return code.replace('/* @vite-ignore */', '').replace('/* @vite-ignore */', '')
                },
            },
        ],
        preparePackageJson({ packageJson }) {
            packageJson.exports['./mtcute.wasm'] = './mtcute.wasm'
            packageJson.exports['./mtcute-simd.wasm'] = './mtcute-simd.wasm'
        },
        finalize({ packageDir, outDir }) {
            fs.cpSync(resolve(packageDir, 'src/mtcute.wasm'), resolve(outDir, 'mtcute.wasm'))
            fs.cpSync(resolve(packageDir, 'src/mtcute-simd.wasm'), resolve(outDir, 'mtcute-simd.wasm'))
        },
    }
}
