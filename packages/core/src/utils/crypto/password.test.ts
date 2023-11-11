import { describe, expect, it } from 'vitest'

import { tl } from '@mtcute/tl'
import { hexDecodeToBuffer, hexEncode, utf8EncodeToBuffer } from '@mtcute/tl-runtime'

import { computePasswordHash, defaultCryptoProviderFactory } from './index.js'

// a real-world request from an account with "qwe123" password
const fakeAlgo: tl.RawPasswordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow = {
    _: 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow',
    salt1: hexDecodeToBuffer('9b3accc457c0d5288e8cff31eb21094048bc11902f6614dbb9afb839ee7641c37619537d8ebe749e'),
    salt2: hexDecodeToBuffer('6c619bb0786dc4ed1bf211d23f6e4065'),
    g: 3,
    p: hexDecodeToBuffer(
        'c71caeb9c6b1c9048e6c522f70f13f73980d40238e3e21c14934d037563d930f' +
            '48198a0aa7c14058229493d22530f4dbfa336f6e0ac925139543aed44cce7c37' +
            '20fd51f69458705ac68cd4fe6b6b13abdc9746512969328454f18faf8c595f64' +
            '2477fe96bb2a941d5bcd1d4ac8cc49880708fa9b378e3c4f3a9060bee67cf9a4' +
            'a4a695811051907e162753b56b0f6b410dba74d8a84b2a14b3144e0ef1284754' +
            'fd17ed950d5965b4b9dd46582db1178d169c6bc465b0d6ff9ca3928fef5b9ae4' +
            'e418fc15e83ebea0f87fa9ff5eed70050ded2849f47bf959d956850ce929851f' +
            '0d8115f635b105ee2e4e15d04b2454bf6f4fadf034b10403119cd8e3b92fcc5b',
    ),
}
// const fakeRequest: tl.account.RawPassword = {
//     _: 'account.password',
//     hasRecovery: false,
//     hasSecureValues: false,
//     hasPassword: true,
//     currentAlgo: fakeAlgo,
//     srpB: hexDecodeToBuffer(
//         '1476a7b5991d7f028bbee33b3455cad3f2cd0eb3737409fcce92fa7d4cd5c733' +
//         'ec6d2cb3454e587d4c17eda2fd7ef9a57327215f38292cc8bd5dc77d3e1d31cd' +
//         'dae2652f8347c4b0093f7c78242f70e6cc13137ee7acc257a49855a63113db8f' +
//         '163992b9101551f3b6f7eb5d196cee3647c359553b1bcbe82ba8933c0fb1ac35' +
//         '0243c535b8e634613e1f626ba8a6d141ef957c859e71a117b557c0298bfbb107' +
//         'c91f71f5b4275fded58289aa1e87c612f44b7aa0b5e0de7def4458f58db80019' +
//         'd2e7b181eb66dc270374af2d160dd0c53edd677b2701694d71ea8718c49df6a9' +
//         'dbe2cbae051ffc1986336cd26f11a8ab426dfe0813d7b3f4eedf4e34182ccc3a',
//     ),
//     srpId: Long.fromBits(-2046015018, 875006452),
//     newAlgo: {
//         _: 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow',
//         salt1: hexDecodeToBuffer('9b3accc457c0d528'),
//         salt2: hexDecodeToBuffer('6c619bb0786dc4ed1bf211d23f6e4065'),
//         g: 3,
//         p: hexDecodeToBuffer(
//             'c71caeb9c6b1c9048e6c522f70f13f73980d40238e3e21c14934d037563d930f' +
//             '48198a0aa7c14058229493d22530f4dbfa336f6e0ac925139543aed44cce7c37' +
//             '20fd51f69458705ac68cd4fe6b6b13abdc9746512969328454f18faf8c595f64' +
//             '2477fe96bb2a941d5bcd1d4ac8cc49880708fa9b378e3c4f3a9060bee67cf9a4' +
//             'a4a695811051907e162753b56b0f6b410dba74d8a84b2a14b3144e0ef1284754' +
//             'fd17ed950d5965b4b9dd46582db1178d169c6bc465b0d6ff9ca3928fef5b9ae4' +
//             'e418fc15e83ebea0f87fa9ff5eed70050ded2849f47bf959d956850ce929851f' +
//             '0d8115f635b105ee2e4e15d04b2454bf6f4fadf034b10403119cd8e3b92fcc5b',
//         ),
//     },
//     newSecureAlgo: {
//         _: 'securePasswordKdfAlgoPBKDF2HMACSHA512iter100000',
//         salt: hexDecodeToBuffer('fdd59abc0bffb24d'),
//     },
//     secureRandom: new Uint8Array(), // unused
// }
const password = utf8EncodeToBuffer('qwe123')

describe('computePasswordHash', () => {
    const crypto = defaultCryptoProviderFactory()

    it('should correctly compute password hash as defined by MTProto', async () => {
        const actual = await computePasswordHash(crypto, password, fakeAlgo.salt1, fakeAlgo.salt2)

        expect(hexEncode(actual)).toEqual('750f1fe282965e63ce17b98427b35549fb864465211840f6a7c1f2fb657cc33b')
    })

    // todo: computeNewPasswordHash and computeSrpParams both require predictable random
})
