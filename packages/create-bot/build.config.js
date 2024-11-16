import { resolve } from 'node:path'
import { cpSync } from 'node:fs'

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
