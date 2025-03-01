/// <reference types="@vitest/browser/providers/playwright" />

import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { mergeConfig } from 'vitest/config'
import { fixupCjs } from './vite-utils/fixup-cjs'
import baseConfig from './vite.js'

export default mergeConfig(baseConfig, {
    test: {
        browser: {
            enabled: true,
            provider: 'playwright',
            slowHijackESM: false,
            headless: Boolean(process.env.CI),
            instances: [
                { browser: 'chromium' },
                { browser: 'firefox' },
                { browser: 'webkit' },
            ],
        },
        fakeTimers: {
            toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
        },
        retry: process.env.CI ? 3 : 0,
        isolate: false,
        fileParallelism: false, // leads to ERR_INSUFFICIENT_RESOURCES
        // for whatever reason using exclude-s makes the vite never start the browser, so we use skip-s instead.
        // exclude: [
        //     './packages/node/**',
        // ],
    },
    plugins: [
        fixupCjs(),
        nodePolyfills({
            include: ['stream', 'path', 'zlib', 'util', 'events'],
            globals: {
                Buffer: false,
                // for WHATEVER REASON browserify-zlib uses `global` and `process` and it dies in browser lol
                global: true,
                process: true,
            },
        }),
    ],
    build: {
        rollupOptions: {
            external: ['bun:sqlite', '@jsr/db__sqlite'],
        },
    },
    define: {
        'import.meta.env.TEST_ENV': '"browser"',
    },
    optimizeDeps: {
        esbuildOptions: {
            target: 'esnext',
        },
    },
})
