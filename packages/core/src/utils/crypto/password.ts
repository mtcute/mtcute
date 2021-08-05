import { tl } from '@mtcute/tl'
import { ICryptoProvider } from './abstract'
import { bigIntToBuffer, bufferToBigInt } from '../bigint-utils'
import bigInt from 'big-integer'
import { randomBytes, xorBuffer } from '../buffer-utils'

export async function computePasswordHash(
    crypto: ICryptoProvider,
    password: Buffer,
    salt1: Buffer,
    salt2: Buffer
): Promise<Buffer> {
    // https://core.telegram.org/api/srp#checking-the-password-with-srp
    const SH = (data: Buffer, salt: Buffer) =>
        crypto.sha256(Buffer.concat([salt, data, salt]))
    const PH1 = async (pwd: Buffer, salt1: Buffer, salt2: Buffer) =>
        SH(await SH(pwd, salt1), salt2)
    const PH2 = async (pwd: Buffer, salt1: Buffer, salt2: Buffer) =>
        SH(
            await crypto.pbkdf2(await PH1(pwd, salt1, salt2), salt1, 100000),
            salt2
        )

    return PH2(password, salt1, salt2)
}

export async function computeNewPasswordHash(
    crypto: ICryptoProvider,
    algo: tl.RawPasswordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow,
    password: string
): Promise<Buffer> {
    ;(algo as tl.Mutable<typeof algo>).salt1 = Buffer.concat([
        algo.salt1,
        randomBytes(32),
    ])

    const _x = await computePasswordHash(
        crypto,
        Buffer.from(password),
        algo.salt1,
        algo.salt2
    )

    const g = bigInt(algo.g)
    const p = bufferToBigInt(algo.p)
    const x = bufferToBigInt(_x)

    return bigIntToBuffer(g.modPow(x, p), 256)
}

export async function computeSrpParams(
    crypto: ICryptoProvider,
    request: tl.account.RawPassword,
    password: string
): Promise<tl.RawInputCheckPasswordSRP> {
    // nice naming thx durov
    if (
        !request.currentAlgo ||
        request.currentAlgo?._ !==
            'passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow'
    ) {
        throw new Error(`Unknown algo ${request.currentAlgo?._}`)
    }

    const algo = request.currentAlgo

    // here and after: underscored variables are buffers, non-underscored are bigInts

    const g = bigInt(algo.g)
    const _g = bigIntToBuffer(g, 256)
    const p = bufferToBigInt(algo.p)
    const gB = bufferToBigInt(request.srpB!)

    const a = bufferToBigInt(randomBytes(256))
    const gA = g.modPow(a, p)
    const _gA = bigIntToBuffer(gA, 256)

    const H = (data: Buffer) => crypto.sha256(data)

    const [_k, _u, _x] = await Promise.all([
        // maybe, just maybe this will be a bit faster with some crypto providers
        /* k = */ crypto.sha256(Buffer.concat([algo.p, _g])),
        /* u = */ crypto.sha256(Buffer.concat([_gA, request.srpB!])),
        /* x = */ computePasswordHash(
            crypto,
            Buffer.from(password),
            algo.salt1,
            algo.salt2
        ),
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
        Buffer.concat([
            xorBuffer(await H(algo.p), await H(_g)),
            await H(algo.salt1),
            await H(algo.salt2),
            _gA,
            request.srpB!,
            _kA,
        ])
    )

    return {
        _: 'inputCheckPasswordSRP',
        srpId: request.srpId!,
        A: _gA,
        M1: _M1,
    }
}
