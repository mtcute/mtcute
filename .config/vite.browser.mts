/// <reference types="vitest" />
import { mergeConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

import baseConfig from './vite.mjs'
import { fixupCjs } from './vite-utils/fixup-cjs'

export default mergeConfig(baseConfig, {
    test: {
        browser: {
            enabled: true,
            name: 'chromium',
            provider: 'playwright',
            slowHijackESM: false,
        },
        fakeTimers: {
            toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date']
        },
        retry: process.env.CI ? 3 : 0,
        isolate: false,
        fileParallelism: false, // leads to ERR_INSUFFICIENT_RESOURCES
        // for whatever reason using exclude-s makes the vite never start the browser, so we use skip-s instead.
        // exclude: [
        //     './packages/crypto-node/**',
        //     './packages/node/**',
        // ],
    },
    plugins: [
        fixupCjs(),
        nodePolyfills({
            include: ['stream', 'path', 'zlib', 'util'],
            globals: {
                Buffer: false,
                global: false,
                process: false,
            },
        })
    ],
    build: {
        rollupOptions: {
            external: ['bun:sqlite']
        }
    },
    define: {
        'import.meta.env.TEST_ENV': '"browser"'
    }
})
