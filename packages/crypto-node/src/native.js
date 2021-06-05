let mod
try {
    mod = require('../build/Release/crypto')
} catch (e) {
    mod = require('../build/Debug/crypto')
}

module.exports = mod
