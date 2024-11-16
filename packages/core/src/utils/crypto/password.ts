import type { tl } from '@mtcute/tl'
import { bigint, u8, utf8 } from '@fuman/utils'

import { MtSecurityError, MtUnsupportedError } from '../../types/errors.js'
import { assertTypeIs } from '../type-assertions.js'

import type { ICryptoProvider } from './abstract.js'

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
    const SH = (data: Uint8Array, salt: Uint8Array) => crypto.sha256(u8.concat3(salt, data, salt))
    const PH1 = (pwd: Uint8Array, salt1: Uint8Array, salt2: Uint8Array) => SH(SH(pwd, salt1), salt2)

    return SH(await crypto.pbkdf2(PH1(password, salt1, salt2), salt1, 100000), salt2)
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
    algo: tl.TypePasswordKdfAlgo,
    password: string,
): Promise<Uint8Array> {
    assertTypeIs('account.getPassword', algo, 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow')

    const salt1 = u8.alloc(algo.salt1.length + 32)
    salt1.set(algo.salt1)
    crypto.randomFill(salt1.subarray(algo.salt1.length))
    ;(algo as tl.Mutable<typeof algo>).salt1 = salt1

    const _x = await computePasswordHash(crypto, utf8.encoder.encode(password), algo.salt1, algo.salt2)

    const g = BigInt(algo.g)
    const p = bigint.fromBytes(algo.p)
    const x = bigint.fromBytes(_x)

    return bigint.toBytes(bigint.modPowBinary(g, x, p), 256)
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
        !request.currentAlgo
        || request.currentAlgo._ !== 'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow'
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

    const g = BigInt(algo.g)
    const _g = bigint.toBytes(g, 256)
    const p = bigint.fromBytes(algo.p)
    const gB = bigint.fromBytes(request.srpB)

    const a = bigint.fromBytes(crypto.randomBytes(256))
    const gA = bigint.modPowBinary(g, a, p)
    const _gA = bigint.toBytes(gA, 256)

    const H = (data: Uint8Array) => crypto.sha256(data)

    const _k = crypto.sha256(u8.concat2(algo.p, _g))
    const _u = crypto.sha256(u8.concat2(_gA, request.srpB))
    const _x = await computePasswordHash(crypto, utf8.encoder.encode(password), algo.salt1, algo.salt2)
    const k = bigint.fromBytes(_k)
    const u = bigint.fromBytes(_u)
    const x = bigint.fromBytes(_x)

    const v = bigint.modPowBinary(g, x, p)
    const kV = (k * v) % p

    let t = gB - kV
    if (t < 0n) t += p
    const sA = bigint.modPowBinary(t, a + u * x, p)
    const _kA = H(bigint.toBytes(sA, 256))

    const _M1 = H(u8.concat([
        u8.xor(H(algo.p), H(_g)),
        H(algo.salt1),
        H(algo.salt2),
        _gA,
        request.srpB,
        _kA,
    ]))

    return {
        _: 'inputCheckPasswordSRP',
        srpId: request.srpId,
        A: _gA,
        M1: _M1,
    }
}
