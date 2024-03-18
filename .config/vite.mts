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
        setupFiles: [
            './.config/vite-utils/test-setup.mts'
        ]
    },
    define: {
        'import.meta.env.TEST_ENV': '"node"'
    }
})
