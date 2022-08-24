const path = require('path')

module.exports = {
    ...require('../../typedoc.js'),
    out: path.join(
        __dirname,
        '../../docs/packages/' +
        require('./package.json').name.replace(/^@.+\//, '')
    ),
    entryPoints: ['./index.ts'],
    excludeExternals: true,
    externalPattern: [
        '../client/**/*',
        '../dispatcher/**/*',
        '../tl/**/*',
        '../html-parser/**/*',
        '../markdown-parser/**/*',
        '../core/**/*',
        '../sqlite/**/*',
        '**/*/node_modules/**/*',
    ]
}
