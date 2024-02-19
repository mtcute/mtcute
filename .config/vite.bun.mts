/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite'

import baseConfig from './vite.mjs'

export default mergeConfig(baseConfig, defineConfig({
    define: {
        'import.meta.env.TEST_ENV': '"bun"'
    }
}))
