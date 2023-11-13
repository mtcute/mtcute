module.exports = {
    extends: ['../../.config/typedoc/config.base.cjs'],
    entryPoints: ['./index.ts'],
    externalPattern: [
        '../client/**',
        '../core/**',
        '../html-parser/**',
        '../markdown-parser/**',
        '../sqlite/**',
    ],
}
