import Long from 'long'

import { mtp } from '@mtcute/tl'
import { TlPublicKey } from '@mtcute/tl/binary/rsa-keys.js'
import { TlBinaryReader, TlBinaryWriter, TlSerializationCounter } from '@mtcute/tl-runtime'

import { MtArgumentError, MtSecurityError, MtTypeAssertionError } from '../types/index.js'
import { buffersEqual, concatBuffers, dataViewFromBuffer } from '../utils/buffer-utils.js'
import { findKeyByFingerprints } from '../utils/crypto/keys.js'
import { millerRabin } from '../utils/crypto/miller-rabin.js'
import { generateKeyAndIvFromNonce } from '../utils/crypto/mtproto.js'
import { xorBuffer, xorBufferInPlace } from '../utils/crypto/utils.js'
import { bigIntModPow, bigIntToBuffer, bufferToBigInt, ICryptoProvider, Logger } from '../utils/index.js'
import { mtpAssertTypeIs } from '../utils/type-assertions.js'
import { SessionConnection } from './session-connection.js'

// Heavily based on code from https://github.com/LonamiWebs/Telethon/blob/master/telethon/network/authenticator.py

// see https://core.telegram.org/mtproto/security_guidelines
// const DH_SAFETY_RANGE = bigInt[2].pow(2048 - 64)
const DH_SAFETY_RANGE = 2n ** (2048n - 64n)
const KNOWN_DH_PRIME =
    // eslint-disable-next-line max-len
    0xc71caeb9c6b1c9048e6c522f70f13f73980d40238e3e21c14934d037563d930f48198a0aa7c14058229493d22530f4dbfa336f6e0ac925139543aed44cce7c3720fd51f69458705ac68cd4fe6b6b13abdc9746512969328454f18faf8c595f642477fe96bb2a941d5bcd1d4ac8cc49880708fa9b378e3c4f3a9060bee67cf9a4a4a695811051907e162753b56b0f6b410dba74d8a84b2a14b3144e0ef1284754fd17ed950d5965b4b9dd46582db1178d169c6bc465b0d6ff9ca3928fef5b9ae4e418fc15e83ebea0f87fa9ff5eed70050ded2849f47bf959d956850ce929851f0d8115f635b105ee2e4e15d04b2454bf6f4fadf034b10403119cd8e3b92fcc5bn
const TWO_POW_2047 = 2n ** 2047n
const TWO_POW_2048 = 2n ** 2048n

interface CheckedPrime {
    prime: bigint
    generators: number[]
}

const checkedPrimesCache: CheckedPrime[] = []

function checkDhPrime(crypto: ICryptoProvider, log: Logger, dhPrime: bigint, g: number) {
    if (KNOWN_DH_PRIME === dhPrime) {
        log.debug('server is using known dh prime, skipping validation')

        return
    }

    let checkedPrime = checkedPrimesCache.find((x) => x.prime === dhPrime)

    if (!checkedPrime) {
        if (dhPrime <= TWO_POW_2047 || dhPrime >= TWO_POW_2048) {
            throw new MtSecurityError('Step 3: dh_prime is not in the 2048-bit range')
        }

        if (!millerRabin(crypto, dhPrime)) {
            throw new MtSecurityError('Step 3: dh_prime is not prime')
        }
        if (!millerRabin(crypto, (dhPrime - 1n) / 2n)) {
            throw new MtSecurityError('Step 3: dh_prime is not a safe prime - (dh_prime-1)/2 is not prime')
        }

        log.debug('dh_prime is probably prime')

        checkedPrime = {
            prime: dhPrime,
            generators: [],
        }
        checkedPrimesCache.push(checkedPrime)
    } else {
        log.debug('dh_prime is probably prime (cached)')
    }

    const generatorChecked = checkedPrime.generators.includes(g)

    if (generatorChecked) {
        log.debug('g = %d is already checked for dh_prime', g)

        return
    }

    switch (g) {
        case 2:
            if (dhPrime % 8n !== 7n) {
                throw new MtSecurityError('Step 3: ivalid g - dh_prime mod 8 != 7')
            }
            break
        case 3:
            if (dhPrime % 3n !== 2n) {
                throw new MtSecurityError('Step 3: ivalid g - dh_prime mod 3 != 2')
            }
            break
        case 4:
            break
        case 5: {
            const mod = dhPrime % 5n

            if (mod !== 1n && mod !== 4n) {
                throw new MtSecurityError('Step 3: ivalid g - dh_prime mod 5 != 1 && dh_prime mod 5 != 4')
            }
            break
        }
        case 6: {
            const mod = dhPrime % 24n

            if (mod !== 19n && mod !== 23n) {
                throw new MtSecurityError('Step 3: ivalid g - dh_prime mod 24 != 19 && dh_prime mod 24 != 23')
            }
            break
        }
        case 7: {
            const mod = dhPrime % 7n

            if (mod !== 3n && mod !== 5n && mod !== 6n) {
                throw new MtSecurityError(
                    'Step 3: ivalid g - dh_prime mod 7 != 3 && dh_prime mod 7 != 5 && dh_prime mod 7 != 6',
                )
            }
            break
        }
        default:
            throw new MtSecurityError(`Step 3: ivalid g - unknown g = ${g}`)
    }

    checkedPrime.generators.push(g)

    log.debug('g = %d is safe to use with dh_prime', g)
}

function rsaPad(data: Uint8Array, crypto: ICryptoProvider, key: TlPublicKey): Uint8Array {
    // since Summer 2021, they use "version of RSA with a variant of OAEP+ padding explained below"

    const keyModulus = BigInt(`0x${key.modulus}`)
    const keyExponent = BigInt(`0x${key.exponent}`)

    if (data.length > 144) {
        throw new MtArgumentError('Failed to pad: too big data')
    }

    const dataPadded = new Uint8Array(192)
    dataPadded.set(data, 0)
    crypto.randomFill(dataPadded.subarray(data.length))
    data = dataPadded

    for (;;) {
        const aesIv = new Uint8Array(32)

        const aesKey = crypto.randomBytes(32)

        const dataWithHash = concatBuffers([data, crypto.sha256(concatBuffers([aesKey, data]))])
        // we only need to reverse the data
        dataWithHash.subarray(0, 192).reverse()

        const aes = crypto.createAesIge(aesKey, aesIv)
        const encrypted = aes.encrypt(dataWithHash)
        const encryptedHash = crypto.sha256(encrypted)

        xorBufferInPlace(aesKey, encryptedHash)
        const decryptedData = concatBuffers([aesKey, encrypted])

        const decryptedDataBigint = bufferToBigInt(decryptedData)

        if (decryptedDataBigint >= keyModulus) {
            continue
        }

        const encryptedBigint = bigIntModPow(decryptedDataBigint, keyExponent, keyModulus)

        return bigIntToBuffer(encryptedBigint, 256)
    }
}

function rsaEncrypt(data: Uint8Array, crypto: ICryptoProvider, key: TlPublicKey): Uint8Array {
    const toEncrypt = concatBuffers([
        crypto.sha1(data),
        data,
        // sha1 is always 20 bytes, so we're left with 255 - 20 - x padding
        crypto.randomBytes(235 - data.length),
    ])

    const encryptedBigInt = bigIntModPow(
        bufferToBigInt(toEncrypt),
        BigInt(`0x${key.exponent}`),
        BigInt(`0x${key.modulus}`),
    )

    return bigIntToBuffer(encryptedBigInt)
}

/**
 * Execute authorization flow on `connection` using `crypto`.
 *
 * @returns  tuple: [authKey, serverSalt, timeOffset]
 */
export async function doAuthorization(
    connection: SessionConnection,
    crypto: ICryptoProvider,
    expiresIn?: number,
): Promise<[Uint8Array, Long, number]> {
    // eslint-disable-next-line dot-notation
    const session = connection['_session']
    const readerMap = session._readerMap
    const writerMap = session._writerMap
    const log = connection.log.create('auth')

    function sendPlainMessage(message: mtp.TlObject): Promise<void> {
        const length = TlSerializationCounter.countNeededBytes(writerMap, message)
        const writer = TlBinaryWriter.alloc(writerMap, length + 20) // 20 bytes for mtproto header

        const messageId = session.getMessageId()

        log.verbose('[PLAIN] >>> %j', message)
        writer.long(Long.ZERO)
        writer.long(messageId)
        writer.uint(length)
        writer.object(message)

        return connection.send(writer.result())
    }

    async function readNext(): Promise<mtp.TlObject> {
        const res = TlBinaryReader.deserializeObject<mtp.TlObject>(
            readerMap,
            await connection.waitForUnencryptedMessage(),
            20, // skip mtproto header
        )

        log.verbose('[PLAIN] <<< %j', res)

        return res
    }

    if (expiresIn) log.prefix = '[PFS] '

    const nonce = crypto.randomBytes(16)
    // Step 1: PQ request
    log.debug('starting PQ handshake (temp = %b), nonce = %h', expiresIn, nonce)

    await sendPlainMessage({ _: 'mt_req_pq_multi', nonce })
    const resPq = await readNext()

    mtpAssertTypeIs('auth step 1', resPq, 'mt_resPQ')

    if (!buffersEqual(resPq.nonce, nonce)) {
        throw new MtSecurityError('Step 1: invalid nonce from server')
    }

    const serverKeys = resPq.serverPublicKeyFingerprints.map((it) => it.toUnsigned().toString(16))
    log.debug('received PQ, keys: %j', serverKeys)

    // Step 2: DH exchange
    const publicKey = findKeyByFingerprints(serverKeys)

    if (!publicKey) {
        throw new MtSecurityError(
            'Step 2: Could not find server public key with any of these fingerprints: ' + serverKeys.join(', '),
        )
    }
    log.debug('found server key, fp = %s, old = %s', publicKey.fingerprint, publicKey.old)

    const [p, q] = await crypto.factorizePQ(resPq.pq)
    log.debug('factorized PQ: PQ = %h, P = %h, Q = %h', resPq.pq, p, q)

    const newNonce = crypto.randomBytes(32)

    let dcId = connection.params.dc.id
    if (connection.params.testMode) dcId += 10000
    if (connection.params.dc.mediaOnly) dcId = -dcId

    const _pqInnerData: mtp.TypeP_Q_inner_data = {
        _: expiresIn ? 'mt_p_q_inner_data_temp_dc' : 'mt_p_q_inner_data_dc',
        pq: resPq.pq,
        p,
        q,
        nonce,
        newNonce,
        serverNonce: resPq.serverNonce,
        dc: dcId,
        expiresIn: expiresIn!, // whatever
    }
    const pqInnerData = TlBinaryWriter.serializeObject(writerMap, _pqInnerData)

    const encryptedData = publicKey.old ?
        rsaEncrypt(pqInnerData, crypto, publicKey) :
        rsaPad(pqInnerData, crypto, publicKey)

    log.debug('requesting DH params')

    await sendPlainMessage({
        _: 'mt_req_DH_params',
        nonce,
        serverNonce: resPq.serverNonce,
        p,
        q,
        publicKeyFingerprint: Long.fromString(publicKey.fingerprint, true, 16),
        encryptedData,
    })
    const serverDhParams = await readNext()

    mtpAssertTypeIs('auth step 2', serverDhParams, 'mt_server_DH_params_ok')

    if (!buffersEqual(serverDhParams.nonce, nonce)) {
        throw new MtSecurityError('Step 2: invalid nonce from server')
    }
    if (!buffersEqual(serverDhParams.serverNonce, resPq.serverNonce)) {
        throw new MtSecurityError('Step 2: invalid server nonce from server')
    }

    log.debug('server DH ok')

    if (serverDhParams.encryptedAnswer.length % 16 !== 0) {
        throw new MtSecurityError('Step 2: AES block size is invalid')
    }

    // Step 3: complete DH exchange
    const [key, iv] = generateKeyAndIvFromNonce(crypto, resPq.serverNonce, newNonce)
    const ige = crypto.createAesIge(key, iv)

    const plainTextAnswer = ige.decrypt(serverDhParams.encryptedAnswer)
    const innerDataHash = plainTextAnswer.subarray(0, 20)
    const serverDhInnerReader = new TlBinaryReader(readerMap, plainTextAnswer, 20)
    const serverDhInner = serverDhInnerReader.object() as mtp.TlObject

    if (!buffersEqual(innerDataHash, crypto.sha1(plainTextAnswer.subarray(20, serverDhInnerReader.pos)))) {
        throw new MtSecurityError('Step 3: invalid inner data hash')
    }

    mtpAssertTypeIs('auth step 3', serverDhInner, 'mt_server_DH_inner_data')

    if (!buffersEqual(serverDhInner.nonce, nonce)) {
        throw Error('Step 3: invalid nonce from server')
    }
    if (!buffersEqual(serverDhInner.serverNonce, resPq.serverNonce)) {
        throw Error('Step 3: invalid server nonce from server')
    }

    const dhPrime = bufferToBigInt(serverDhInner.dhPrime)
    const timeOffset = Math.floor(Date.now() / 1000) - serverDhInner.serverTime

    const g = BigInt(serverDhInner.g)
    const gA = bufferToBigInt(serverDhInner.gA)

    checkDhPrime(crypto, log, dhPrime, serverDhInner.g)

    let retryId = Long.ZERO
    const serverSalt = xorBuffer(newNonce.subarray(0, 8), resPq.serverNonce.subarray(0, 8))

    for (;;) {
        const b = bufferToBigInt(crypto.randomBytes(256))
        const gB = bigIntModPow(g, b, dhPrime)

        const authKey = bigIntToBuffer(bigIntModPow(gA, b, dhPrime))
        const authKeyAuxHash = crypto.sha1(authKey).subarray(0, 8)

        // validate DH params
        if (g <= 1 || g >= dhPrime - 1n) {
            throw new MtSecurityError('g is not within (1, dh_prime - 1)')
        }
        if (gA <= 1 || gA >= dhPrime - 1n) {
            throw new MtSecurityError('g_a is not within (1, dh_prime - 1)')
        }
        if (gB <= 1 || gB >= dhPrime - 1n) {
            throw new MtSecurityError('g_b is not within (1, dh_prime - 1)')
        }

        if (gA <= DH_SAFETY_RANGE || gA >= dhPrime - DH_SAFETY_RANGE) {
            throw new MtSecurityError('g_a is not within (2^{2048-64}, dh_prime - 2^{2048-64})')
        }
        if (gB <= DH_SAFETY_RANGE || gB >= dhPrime - DH_SAFETY_RANGE) {
            throw new MtSecurityError('g_b is not within (2^{2048-64}, dh_prime - 2^{2048-64})')
        }

        const gB_ = bigIntToBuffer(gB, 0, false)

        // Step 4: send client DH
        const clientDhInner: mtp.RawMt_client_DH_inner_data = {
            _: 'mt_client_DH_inner_data',
            nonce,
            serverNonce: resPq.serverNonce,
            retryId,
            gB: gB_,
        }
        let innerLength = TlSerializationCounter.countNeededBytes(writerMap, clientDhInner) + 20 // for hash
        const innerPaddingLength = innerLength % 16
        if (innerPaddingLength > 0) innerLength += 16 - innerPaddingLength

        const clientDhInnerWriter = TlBinaryWriter.alloc(writerMap, innerLength)
        clientDhInnerWriter.pos = 20
        clientDhInnerWriter.object(clientDhInner)
        const clientDhInnerHash = crypto.sha1(clientDhInnerWriter.uint8View.subarray(20, clientDhInnerWriter.pos))
        clientDhInnerWriter.pos = 0
        clientDhInnerWriter.raw(clientDhInnerHash)

        log.debug('sending client DH (timeOffset = %d)', timeOffset)

        const clientDhEncrypted = ige.encrypt(clientDhInnerWriter.uint8View)
        await sendPlainMessage({
            _: 'mt_set_client_DH_params',
            nonce,
            serverNonce: resPq.serverNonce,
            encryptedData: clientDhEncrypted,
        })

        const dhGen = await readNext()

        if (!mtp.isAnySet_client_DH_params_answer(dhGen)) {
            throw new MtTypeAssertionError('auth step 4', 'set_client_DH_params_answer', dhGen._)
        }

        if (!buffersEqual(dhGen.nonce, nonce)) {
            throw Error('Step 4: invalid nonce from server')
        }
        if (!buffersEqual(dhGen.serverNonce, resPq.serverNonce)) {
            throw Error('Step 4: invalid server nonce from server')
        }

        log.debug('DH result: %s', dhGen._)

        if (dhGen._ === 'mt_dh_gen_fail') {
            // in theory i would be supposed to calculate newNonceHash, but why, we are failing anyway
            throw new MtTypeAssertionError('auth step 4', '!mt_dh_gen_fail', dhGen._)
        }

        if (dhGen._ === 'mt_dh_gen_retry') {
            const expectedHash = crypto.sha1(concatBuffers([newNonce, new Uint8Array([2]), authKeyAuxHash]))

            if (!buffersEqual(expectedHash.subarray(4, 20), dhGen.newNonceHash2)) {
                throw Error('Step 4: invalid retry nonce hash from server')
            }
            retryId = Long.fromBytesLE(authKeyAuxHash as unknown as number[])
            continue
        }

        if (dhGen._ !== 'mt_dh_gen_ok') throw new Error() // unreachable

        const expectedHash = crypto.sha1(concatBuffers([newNonce, new Uint8Array([1]), authKeyAuxHash]))

        if (!buffersEqual(expectedHash.subarray(4, 20), dhGen.newNonceHash1)) {
            throw Error('Step 4: invalid nonce hash from server')
        }

        log.info('authorization successful')

        const dv = dataViewFromBuffer(serverSalt)

        return [authKey, new Long(dv.getInt32(0, true), dv.getInt32(4, true)), timeOffset]
    }
}
