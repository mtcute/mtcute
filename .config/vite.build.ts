/// <reference types="vitest" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// todo
import { fumanBuild } from '@fuman/build/vite'
import type { ConfigEnv, UserConfig } from 'vite'
import { nodeExternals } from 'rollup-plugin-node-externals'
import dts from 'vite-plugin-dts'

const rootDir = fileURLToPath(new URL('..', import.meta.url))

export default async (env: ConfigEnv): Promise<UserConfig> => {
    if (env.command !== 'build') {
        throw new Error('This config is only for building')
    }

    const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'))

    const CJS_DEPRECATION_WARNING = `
if (typeof globalThis !== 'undefined' && !globalThis._MTCUTE_CJS_DEPRECATION_WARNED) { 
    globalThis._MTCUTE_CJS_DEPRECATION_WARNED = true
    console.warn("[${packageJson.name}] CommonJS support is deprecated and will be removed soon. Please consider switching to ESM, it's "+(new Date()).getFullYear()+" already.")
    console.warn("[${packageJson.name}] Learn more about switching to ESM: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c")
}
    `.trim()

    return {
        build: {
            rollupOptions: {
                plugins: [
                    {
                        name: 'mtcute-cjs-deprecated',
                        renderChunk(code, chunk, options) {
                            if (options.format !== 'cjs') return null

                            return `${CJS_DEPRECATION_WARNING}\n${code}`
                        },
                    },
                ],
            },
            minify: false,
            outDir: 'dist',
            emptyOutDir: true,
            target: 'es2022',
        },
        plugins: [
            nodeExternals({
                builtinsPrefix: 'ignore',
            }),
            fumanBuild({
                root: rootDir,
                autoSideEffectsFalse: true,
            }),
            dts({
                // broken; see https://github.com/qmhc/vite-plugin-dts/issues/321, https://github.com/microsoft/rushstack/issues/3557
                // rollupTypes: true,
                insertTypesEntry: true,
            }),
        ],
    }
}
