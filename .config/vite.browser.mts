/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite'
import * as cjsLexer from 'cjs-module-lexer'
import esbuild from 'esbuild'

import baseConfig from './vite.mjs'

await cjsLexer.init()

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
        {
            name: 'fixup-cjs',
            async transform(code, id) {
                if (!id.match(/\/packages\/tl\/.*\.js$/)) return code
                
                const lexed = cjsLexer.parse(code)
                const r = await esbuild.transform(code, { format: 'esm' })
                code = r.code.replace(/export default require_stdin\(\);/, '')

                code += 'const __exp = require_stdin()\n'

                for (const exp of lexed.exports) {
                    code += `export const ${exp} = __exp.${exp}\n`
                }

                return code
            }
        }
    ],
    define: {
        'import.meta.env.TEST_ENV': '"browser"'
    }
}))
