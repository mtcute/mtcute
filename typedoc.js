const path = require('path')

module.exports = {
    includeVersion: true,
    validation: {
        notExported: true,
        invalidLink: true,
        notDocumented: false,
    },
    excludePrivate: true,
    excludeExternals: true,
    exclude: ['**/*/dist', '**/*/node_modules'],
    plugin: [
        'typedoc-plugin-coverage',
        path.join(__dirname, 'scripts/totally-great-typedoc-plugin.js'),
    ],
}
