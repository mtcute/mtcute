module.exports = {
    includeVersion: true,
    validation: {
        notExported: true,
        invalidLink: false,
        notDocumented: false,
    },
    excludePrivate: true,
    excludeExternals: true,
    excludeInternal: true,
    exclude: [
        '**/*/node_modules',
        './packages/tl/**/*',
    ],
    externalPattern: ['**/dist/**'],
    plugin: [
        './scripts/typedoc-external-links.cjs',
    ],
}
