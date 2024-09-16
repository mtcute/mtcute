import { resolve } from 'node:path'
import { cpSync } from 'node:fs'

export default () => ({
    buildCjs: false,
    final({ outDir, packageDir }) {
        cpSync(resolve(packageDir, 'template'), resolve(outDir, 'template'), { recursive: true })
    },
})
