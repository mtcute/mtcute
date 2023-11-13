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
        '**/*.test.ts',
        '**/*.test-utils.ts',
    ],
    externalPattern: ['**/dist/**'],
    plugin: [
        './plugin-external-links.cjs',
    ],
}
