import { defineConfig } from 'vite'
import { globSync } from 'glob'
import { resolve, join } from 'path'
import * as fs from 'fs'
import { fixupCjs } from './vite-utils/fixup-cjs'
import { testSetup } from './vite-utils/test-setup-plugin'

const SKIP_PACKAGES = ['create-bot', 'crypto-node']

// https://github.com/oven-sh/bun/issues/4145 prevents us from using vitest directly
// so we have to use bun's native test runner
const FIXUP_TEST = resolve(__dirname, 'vite-utils/fixup-bun-test.ts')


// bun:test doesn't support certain features of vitest, so we'll skip them for now
// https://github.com/oven-sh/bun/issues/1825
const SKIP_TESTS = [
    // uses timers
    'core/src/network/config-manager.test.ts',
    // incompatible spies
    'core/src/utils/crypto/mtproto.test.ts',
    // snapshot format
    'tl-utils/src/codegen/errors.test.ts'
].map(path => resolve(__dirname, '../packages', path))

export default defineConfig({
    build: {
        lib: {
            entry: (() => {
                const files: string[] = []

                const packages = resolve(__dirname, '../packages')

                for (const dir of fs.readdirSync(packages)) {
                    if (dir.startsWith('.') || SKIP_PACKAGES.includes(dir)) continue
                    if (!fs.statSync(resolve(packages, dir)).isDirectory()) continue

                    const fullDir = resolve(packages, dir)

                    for (const file of globSync(join(fullDir, '**/*.test.ts'))) {
                        if (SKIP_TESTS.includes(file)) continue
                        files.push(file)
                    }
                }

                return files
            })(),
            formats: ['es'],
        },
        rollupOptions: {
            external: [
                'zlib',
                'vitest',
                'stream',
                'net',
                'crypto',
                'module',
                'fs',
                'fs/promises',
                'events',
                'path',
                'util',
                'os',
                'bun:test',
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
        outDir: 'dist/tests',
        emptyOutDir: true,
        target: 'esnext',
        minify: false,
    },
    plugins: [
        fixupCjs(),
        {
            name: 'fix-vitest',
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
                        code += `\nimport { ${namesFromFixup.join(', ')} } from '${FIXUP_TEST}'`
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
