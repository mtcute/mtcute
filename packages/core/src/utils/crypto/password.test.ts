import Long from 'long'
import { describe, expect, it } from 'vitest'

import { defaultTestCryptoProvider } from '@mtcute/test'
import { tl } from '@mtcute/tl'

import { getPlatform } from '../../platform.js'
import { computeNewPasswordHash, computePasswordHash, computeSrpParams } from './index.js'

const p = getPlatform()

// a real-world request from an account with "qwe123" password
const fakeAlgo: tl.RawPasswordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow = {
    _: 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow',
    salt1: p.hexDecode('9b3accc457c0d5288e8cff31eb21094048bc11902f6614dbb9afb839ee7641c37619537d8ebe749e'),
    salt2: p.hexDecode('6c619bb0786dc4ed1bf211d23f6e4065'),
    g: 3,
    p: p.hexDecode(
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
const fakeRequest: tl.account.RawPassword = {
    _: 'account.password',
    hasRecovery: false,
    hasSecureValues: false,
    hasPassword: true,
    currentAlgo: fakeAlgo,
    srpB: p.hexDecode(
        '1476a7b5991d7f028bbee33b3455cad3f2cd0eb3737409fcce92fa7d4cd5c733' +
            'ec6d2cb3454e587d4c17eda2fd7ef9a57327215f38292cc8bd5dc77d3e1d31cd' +
            'dae2652f8347c4b0093f7c78242f70e6cc13137ee7acc257a49855a63113db8f' +
            '163992b9101551f3b6f7eb5d196cee3647c359553b1bcbe82ba8933c0fb1ac35' +
            '0243c535b8e634613e1f626ba8a6d141ef957c859e71a117b557c0298bfbb107' +
            'c91f71f5b4275fded58289aa1e87c612f44b7aa0b5e0de7def4458f58db80019' +
            'd2e7b181eb66dc270374af2d160dd0c53edd677b2701694d71ea8718c49df6a9' +
            'dbe2cbae051ffc1986336cd26f11a8ab426dfe0813d7b3f4eedf4e34182ccc3a',
    ),
    srpId: Long.fromBits(-2046015018, 875006452),
    newAlgo: {
        _: 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow',
        salt1: p.hexDecode('9b3accc457c0d528'),
        salt2: p.hexDecode('6c619bb0786dc4ed1bf211d23f6e4065'),
        g: 3,
        p: p.hexDecode(
            'c71caeb9c6b1c9048e6c522f70f13f73980d40238e3e21c14934d037563d930f' +
                '48198a0aa7c14058229493d22530f4dbfa336f6e0ac925139543aed44cce7c37' +
                '20fd51f69458705ac68cd4fe6b6b13abdc9746512969328454f18faf8c595f64' +
                '2477fe96bb2a941d5bcd1d4ac8cc49880708fa9b378e3c4f3a9060bee67cf9a4' +
                'a4a695811051907e162753b56b0f6b410dba74d8a84b2a14b3144e0ef1284754' +
                'fd17ed950d5965b4b9dd46582db1178d169c6bc465b0d6ff9ca3928fef5b9ae4' +
                'e418fc15e83ebea0f87fa9ff5eed70050ded2849f47bf959d956850ce929851f' +
                '0d8115f635b105ee2e4e15d04b2454bf6f4fadf034b10403119cd8e3b92fcc5b',
        ),
    },
    newSecureAlgo: {
        _: 'securePasswordKdfAlgoPBKDF2HMACSHA512iter100000',
        salt: p.hexDecode('fdd59abc0bffb24d'),
    },
    secureRandom: new Uint8Array(), // unused
}
const password = 'qwe123'

describe('SRP', () => {
    it('should correctly compute password hash as defined by MTProto', async () => {
        const crypto = await defaultTestCryptoProvider()
        const hash = await computePasswordHash(crypto, p.utf8Encode(password), fakeAlgo.salt1, fakeAlgo.salt2)

        expect(p.hexEncode(hash)).toEqual('750f1fe282965e63ce17b98427b35549fb864465211840f6a7c1f2fb657cc33b')
    })

    it('should correctly compute new password hash as defined by MTProto', async () => {
        const crypto = await defaultTestCryptoProvider()
        const hash = await computeNewPasswordHash(crypto, fakeAlgo, '123qwe')

        expect(p.hexEncode(hash)).toEqual(
            '2540539ceeffd4543cd845bf319b8392e6b17bf7cf26bafcf6282ce9ae795368' +
                '4ff49469c2863b17e6d65ddb16ae6f60bc07cc254c00e5ba389292f6cea0b3aa' +
                'c459d1d08984d65319df8c5d124042169bbe2ab8c0c93bc7178827f2ea84e7c3' +
                'a4f2660099fb6a4c38984c914283d3015278369521a4b81ecf927669b8c89746' +
                'ef49ec7b019af7f3addc746362f298d96409bef4677b9c3d8e5b5afe7a44c0bc' +
                '130ebc7a79b5d5980966d88d3d9eba511b101b0703abd86df7410cd120edad12' +
                '2a7a3ccad92d906dbf6f43bba13555bafb626b45551275f3626a4ae26a14908d' +
                '38d640680e501f52bd08a0e3ff9d9185eebdae890c167459449b2c205b3ecde4',
        )
    })

    it('should correctly compute srp parameters as defined by MTProto', async () => {
        const crypto = await defaultTestCryptoProvider()
        const params = await computeSrpParams(crypto, fakeRequest, password)

        expect(params.srpId).toEqual(fakeRequest.srpId)
        expect(p.hexEncode(params.A)).toEqual(
            '363976f55edb57cc5cc0c4aaca9b7539eff98a43a93fa84be34860d18ac3a80f' +
                'ffd57c4617896ff667677d0552a079eb189d25d147ec96edd4495c946a18652d' +
                '31d78eede40a8b29da340c19b32ccac78f8482406e392102c03d850d1db87223' +
                '2c144bfacadb58856971aafb70ca3aac4efa7f73977ddc50dfc0a2c76c0ac950' +
                '728d58b8480fa89c701703855148fadd885aaf1ca313ae3a3b2942de58a9a6fb' +
                '9e3e65c7ac7a1b7f4e6aa4742b957f81927bd8cc761b76f90229dec34d6f15d3' +
                '4fa454aa69d9219d9c5fa3625f5c6f1ac03892a70aa17269c76cd9bf2949a961' +
                'fad2a71e5fa961824b32db037130c7e9aad4c1e9f02ebc5b832622f98b59597e',
        )
        expect(p.hexEncode(params.M1)).toEqual('25a91b21c634ad670a144165a9829192d152e131a716f676abc48cd817f508c6')
    })
})
