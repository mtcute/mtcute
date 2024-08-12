/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: [
            'packages/**/*.test.ts',
        ],
        typecheck: {
            include: [
                'packages/**/*.test-d.ts',
            ],
        },
        coverage: {
            include: [
                'packages/**/*.ts',
            ],
            exclude: [
                'packages/**/index.ts',
            ]
        },
        setupFiles: [
            './.config/vite-utils/test-setup.mts'
        ]
    },
    define: {
        'import.meta.env.TEST_ENV': '"node"'
    },
    optimizeDeps: {
        esbuildOptions: {
            // for WHATEVER REASON browserify-zlib uses `global` and it dies in browser lol
            define: {
                global: 'globalThis',
            },
        },
    },
})
