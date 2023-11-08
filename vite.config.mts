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
        }
    },
})
