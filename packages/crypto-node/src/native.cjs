/* eslint-disable no-restricted-globals */
let native

try {
    native = require('../build/Release/crypto')
} catch (e) {
    native = require('../build/Debug/crypto')
}

module.exports = { native }
