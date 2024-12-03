import { cpSync } from 'node:fs'
import { resolve } from 'node:path'

/** @type {import('@fuman/build/vite').CustomBuildConfig} */
export default () => ({
    viteConfig: {
        build: {
            lib: {
                formats: ['es'],
            },
        },
    },
    finalize({ outDir, packageDir }) {
        cpSync(resolve(packageDir, 'template'), resolve(outDir, 'template'), { recursive: true })
    },
})
