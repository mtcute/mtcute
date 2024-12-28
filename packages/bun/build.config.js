/** @type {import('@fuman/build/vite').CustomBuildConfig} */
export default {
    viteConfig: {
        build: {
            lib: {
                formats: ['es'],
            },
            rollupOptions: {
                external: ['bun', 'bun:sqlite'],
            },
        },
    },
    typedoc: {
        externalPattern: [
            '../core/**',
            '../html-parser/**',
            '../markdown-parser/**',
            '../sqlite/**',
        ],
    },
}
