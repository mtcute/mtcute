module.exports = {
    extends: ['../../.config/typedoc/config.base.cjs'],
    entryPoints: ['./src/index.ts'],
    externalPattern: [
        '../core/**',
        '../html-parser/**',
        '../markdown-parser/**',
        '../sqlite/**',
    ],
}
