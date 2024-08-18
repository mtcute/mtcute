const fs = require('node:fs')
const path = require('node:path')

module.exports = {
    ...require('./config.base.cjs'),
    name: 'mtcute',
    out: '../../docs',
    entryPoints: fs
        .readdirSync(path.join(__dirname, '../../packages'))
        .filter(it => !['crypto', 'tl', 'create-bot'].includes(it))
        .map(it => `../../packages/${it}`),
    entryPointStrategy: 'packages',
    // logLevel: 'Verbose',
}
