import { resolve } from 'node:path'
import * as fs from 'node:fs'

export default () => ({
    finalPackageJson(pkg) {
        pkg.exports['./mtcute.wasm'] = './mtcute.wasm'
    },
    final({ packageDir, outDir }) {
        fs.cpSync(resolve(packageDir, 'src/mtcute.wasm'), resolve(outDir, 'mtcute.wasm'))
    },
})
