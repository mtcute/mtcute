const fs = require('fs')
const path = require('path')

module.exports = {
    ...require('./config.base.cjs'),
    name: 'mtcute',
    out: '../../docs',
    entryPoints: fs
        .readdirSync(path.join(__dirname, '../../packages'))
        .filter((it) => !['crypto', 'tl', 'create-bot'].includes(it))
        .map((it) => `../../packages/${it}`),
    entryPointStrategy: 'packages',
    // logLevel: 'Verbose',
}
