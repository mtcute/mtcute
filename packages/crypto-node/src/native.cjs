// eslint-disable-next-line node/no-path-concat
const native = require('node-gyp-build')(`${__dirname}/..`)

module.exports = { native }
