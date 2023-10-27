module.exports = {
    extends: ['../../typedoc.base.cjs'],
    entryPoints: ['./index.ts'],
    externalPattern: [
        '../client/**',
        '../core/**',
        '../html-parser/**',
        '../markdown-parser/**',
        '../sqlite/**',
    ],
}
