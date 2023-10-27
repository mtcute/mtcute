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
        '**/*/dist',
        '**/*/node_modules',
        './packages/tl/**/*',
    ],
    plugin: [
        './scripts/typedoc-external-links.cjs',
    ],
}
