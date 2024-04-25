import { defineConfig } from 'vite'
import { globSync } from 'glob'
import { resolve, join } from 'path'
import * as fs from 'fs'
import { fixupCjs } from './vite-utils/fixup-cjs'
import { testSetup } from './vite-utils/test-setup-plugin'
import { collectTestEntrypoints } from './vite-utils/collect-test-entrypoints'

const POLYFILLS = resolve(__dirname, 'vite-utils/polyfills-bun.ts')

export default defineConfig({
    build: {
        lib: {
            entry: process.env.ENTRYPOINT ? [process.env.ENTRYPOINT] : collectTestEntrypoints({
                // https://github.com/oven-sh/bun/issues/4145 prevents us from using vitest directly
                // so we have to use bun's native test runner
                skipPackages: ['create-bot', 'crypto-node'],
                // bun:test doesn't support certain features of vitest, so we'll skip them for now
                // https://github.com/oven-sh/bun/issues/1825
                skipTests: [
                    // uses timers
                    'core/src/network/config-manager.test.ts',
                    'core/src/network/persistent-connection.test.ts',
                ],
            }),
            formats: ['es'],
        },
        rollupOptions: {
            external: [
                'node:zlib',
                'vitest',
                'stream',
                'net',
                'crypto',
                'module',
                'fs',
                'fs/promises',
                'node:fs',
                'readline',
                'worker_threads',
                'events',
                'path',
                'util',
                'os',
                'bun:test',
                'bun:sqlite',
            ],
            output: {
                chunkFileNames: 'chunk-[hash].js',
                entryFileNames: '[name]-[hash].test.js',
                minifyInternalExports: false,
            },
            treeshake: false,
        },
        commonjsOptions: {
            ignoreDynamicRequires: true,
        },
        outDir: process.env.OUT_DIR || 'dist/tests',
        emptyOutDir: true,
        target: 'esnext',
        minify: false,
    },
    plugins: [
        fixupCjs(),
        {
            name: 'polyfills',
            transform(code) {
                if (!code.includes('vitest')) return code
                code = code.replace(/^import {(.+?)} from ['"]vitest['"]/gms, (_, names) => {
                    const namesParsed = names.split(',').map((name) => name.trim())

                    const namesFromFixup: string[] = []
                    const newNames = namesParsed
                        .map((name) => {
                            if (['expect', 'vi', 'it'].includes(name)) {
                                namesFromFixup.push(name)
                                return ''
                            }
                            return name
                        })
                        .filter(Boolean)

                    let code = `import {${newNames.join(', ')}} from 'bun:test'`

                    if (namesFromFixup.length) {
                        code += `\nimport { ${namesFromFixup.join(', ')} } from '${POLYFILLS}'`
                    }
                    return code
                })
                return code
            },
        },
        {
            name: 'fix-wasm-load',
            async transform(code, id) {
                if (code.includes('@mtcute/wasm/mtcute.wasm')) {
                    return code.replace('@mtcute/wasm/mtcute.wasm', resolve(__dirname, '../packages/wasm/mtcute.wasm'))
                }

                return code
            }
        },
        testSetup(),
    ],
    define: {
        'import.meta.env.TEST_ENV': '"bun"',
    },
})
