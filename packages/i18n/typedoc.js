const path = require('path')

module.exports = {
    ...require('../../typedoc.js'),
    out: path.join(
        __dirname,
        '../../docs/packages/' +
        require('./package.json').name.replace(/^@.+\//, ''),
    ),
    entryPoints: [
        './src/index.ts',
        './src/plurals/english.ts',
        './src/plurals/russian.ts',
    ],
}
