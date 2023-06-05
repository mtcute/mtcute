const path = require('path')

module.exports = {
    ...require('../../typedoc.js'),
    out: path.join(
        __dirname,
        '../../docs/packages/' +
        require('./package.json').name.replace(/^@.+\//, ''),
    ),
    entryPoints: ['./src/index.ts'],
    excludeExternals: true,
    externalPattern: [
        // '../client/**/*',
        '../tl/**/*',
        '**/*/node_modules/**/*',
    ],
}
