import { resolve } from 'node:path'

import { defineConfig } from 'vite'

import { fixupCjs } from './vite-utils/fixup-cjs'
import { testSetup } from './vite-utils/test-setup-plugin'
import { collectTestEntrypoints } from './vite-utils/collect-test-entrypoints'

const POLYFILLS = resolve(__dirname, 'vite-utils/polyfills-deno.ts')

export default defineConfig({
    build: {
        lib: {
            entry: process.env.ENTRYPOINT
                ? [process.env.ENTRYPOINT]
                : collectTestEntrypoints({
                    // these packages rely on node apis and are not meant to be run under deno
                    skipPackages: ['create-bot', 'crypto-node', 'bun', 'node'],
                    skipTests: [
                        // uses timers
                        'core/src/network/config-manager.test.ts',
                        'core/src/network/persistent-connection.test.ts',
                        // https://github.com/denoland/deno/issues/22470
                        'wasm/tests/gunzip.test.ts',
                        'wasm/tests/zlib.test.ts',
                        // use fixtures
                        'convert/src/tdesktop/tdata.test.ts',
                    ],
                }),
            formats: ['es'],
        },
        rollupOptions: {
            external: [
                /^(jsr|npm|node|https?):/,
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
                code = code.replace(/^import \{(.+?)\} from ['"]vitest['"]/gms, (_, names) => {
                    const namesParsed = names.split(',').map(name => name.trim())

                    return `import {${namesParsed.join(', ')}} from '${POLYFILLS}'`
                })
                return code
            },
        },
        {
            name: 'fix-wasm-load',
            async transform(code) {
                if (code.includes('./mtcute.wasm')) {
                    return code.replace(/\.?\.\/mtcute\.wasm/, resolve(__dirname, '../packages/wasm/src/mtcute.wasm'))
                }

                return code
            },
        },
        testSetup(),
    ],
    define: {
        'import.meta.env.TEST_ENV': '"deno"',
    },
})
