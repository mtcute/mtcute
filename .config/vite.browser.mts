/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite'

import baseConfig from './vite.mjs'
import { fixupCjs } from './vite-utils/fixup-cjs'

export default mergeConfig(baseConfig, defineConfig({
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
        // for whatever reason using exclude-s makes the vite never start the browser, so we use skip-s instead.
        // exclude: [
        //     './packages/crypto-node/**',
        //     './packages/node/**',
        // ],
    },
    plugins: [
        fixupCjs(),
    ],
    define: {
        'import.meta.env.TEST_ENV': '"browser"'
    }
}))
