import bigInt from 'big-integer'

import { tl } from '@mtcute/tl'
import { utf8EncodeToBuffer } from '@mtcute/tl-runtime'

import { MtSecurityError, MtUnsupportedError } from '../../types/errors.js'
import { bigIntToBuffer, bufferToBigInt } from '../bigint-utils.js'
import { concatBuffers, randomBytes } from '../buffer-utils.js'
import { ICryptoProvider } from './abstract.js'
import { xorBuffer } from './utils.js'

/**
 * Compute password hash as defined by MTProto.
 *
 * See https://core.telegram.org/api/srp#checking-the-password-with-srp
 *
 * @param crypto  Crypto provider
 * @param password  Password
 * @param salt1  Salt 1
 * @param salt2  Salt 2
 */
export async function computePasswordHash(
    crypto: ICryptoProvider,
    password: Uint8Array,
    salt1: Uint8Array,
    salt2: Uint8Array,
): Promise<Uint8Array> {
    const SH = (data: Uint8Array, salt: Uint8Array) => crypto.sha256(concatBuffers([salt, data, salt]))
    const PH1 = async (pwd: Uint8Array, salt1: Uint8Array, salt2: Uint8Array) => SH(await SH(pwd, salt1), salt2)

    return SH(await crypto.pbkdf2(await PH1(password, salt1, salt2), salt1, 100000), salt2)
}

/**
 * Compute new password SRP hash as defined by MTProto.
 *
 * @param crypto  Crypto provider
 * @param algo  KDF algorithm
 * @param password  Password
 */
export async function computeNewPasswordHash(
    crypto: ICryptoProvider,
    algo: tl.RawPasswordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow,
    password: string,
): Promise<Uint8Array> {
    (algo as tl.Mutable<typeof algo>).salt1 = concatBuffers([algo.salt1, randomBytes(32)])

    const _x = await computePasswordHash(crypto, utf8EncodeToBuffer(password), algo.salt1, algo.salt2)

    const g = bigInt(algo.g)
    const p = bufferToBigInt(algo.p)
    const x = bufferToBigInt(_x)

    return bigIntToBuffer(g.modPow(x, p), 256)
}

/**
 * Compute SRP check parameters for 2fa password as defined by MTProto.
 *
 * @param crypto  Crypto provider
 * @param request  SRP request
 * @param password  2fa password
 */
export async function computeSrpParams(
    crypto: ICryptoProvider,
    request: tl.account.RawPassword,
    password: string,
): Promise<tl.RawInputCheckPasswordSRP> {
    // nice naming thx durov
    if (
        !request.currentAlgo ||
        request.currentAlgo._ !== 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow'
    ) {
        throw new MtUnsupportedError(`Unknown algo ${request.currentAlgo?._}`)
    }

    const algo = request.currentAlgo

    // here and after: underscored variables are buffers, non-underscored are bigInts

    if (!request.srpB) {
        throw new MtSecurityError('SRP_B is not present in the request')
    }

    if (!request.srpId) {
        throw new MtSecurityError('SRP_ID is not present in the request')
    }

    const g = bigInt(algo.g)
    const _g = bigIntToBuffer(g, 256)
    const p = bufferToBigInt(algo.p)
    const gB = bufferToBigInt(request.srpB)

    const a = bufferToBigInt(randomBytes(256))
    const gA = g.modPow(a, p)
    const _gA = bigIntToBuffer(gA, 256)

    const H = (data: Uint8Array) => crypto.sha256(data)

    const [_k, _u, _x] = await Promise.all([
        // maybe, just maybe this will be a bit faster with some crypto providers
        /* k = */ crypto.sha256(concatBuffers([algo.p, _g])),
        /* u = */ crypto.sha256(concatBuffers([_gA, request.srpB])),
        /* x = */ computePasswordHash(crypto, utf8EncodeToBuffer(password), algo.salt1, algo.salt2),
    ])
    const k = bufferToBigInt(_k)
    const u = bufferToBigInt(_u)
    const x = bufferToBigInt(_x)

    const v = g.modPow(x, p)
    const kV = k.multiply(v).mod(p)

    let t = gB.minus(kV).mod(p)
    if (t.isNegative()) t = t.plus(p)
    const sA = t.modPow(a.plus(u.multiply(x)), p)
    const _kA = await H(bigIntToBuffer(sA, 256))

    const _M1 = await H(
        concatBuffers([
            xorBuffer(await H(algo.p), await H(_g)),
            await H(algo.salt1),
            await H(algo.salt2),
            _gA,
            request.srpB,
            _kA,
        ]),
    )

    return {
        _: 'inputCheckPasswordSRP',
        srpId: request.srpId,
        A: _gA,
        M1: _M1,
    }
}
