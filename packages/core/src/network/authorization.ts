import bigInt from 'big-integer'
import Long from 'long'
import { mtp } from '@mtcute/tl'
import {
    TlBinaryReader,
    TlBinaryWriter,
    TlSerializationCounter,
} from '@mtcute/tl-runtime'
import { TlPublicKey } from '@mtcute/tl/binary/rsa-keys'

import { findKeyByFingerprints } from '../utils/crypto/keys'
import { generateKeyAndIvFromNonce } from '../utils/crypto/mtproto'
import {
    buffersEqual,
    randomBytes,
    xorBuffer,
    xorBufferInPlace,
} from '../utils/buffer-utils'
import { ICryptoProvider, bigIntToBuffer, bufferToBigInt } from '../utils'
import { SessionConnection } from './session-connection'

// Heavily based on code from https://github.com/LonamiWebs/Telethon/blob/master/telethon/network/authenticator.py

const DH_SAFETY_RANGE = bigInt[2].pow(2048 - 64)

async function rsaPad(
    data: Buffer,
    crypto: ICryptoProvider,
    key: TlPublicKey
): Promise<Buffer> {
    // since Summer 2021, they use "version of RSA with a variant of OAEP+ padding explained below"

    const keyModulus = bigInt(key.modulus, 16)
    const keyExponent = bigInt(key.exponent, 16)

    if (data.length > 144) {
        throw new Error('Failed to pad: too big data')
    }

    data = Buffer.concat([data, randomBytes(192 - data.length)])

    for (;;) {
        const aesIv = Buffer.alloc(32)

        const aesKey = randomBytes(32)

        const dataWithHash = Buffer.concat([
            data,
            await crypto.sha256(Buffer.concat([aesKey, data])),
        ])
        // we only need to reverse the data
        dataWithHash.slice(0, 192).reverse()

        const aes = crypto.createAesIge(aesKey, aesIv)
        const encrypted = await aes.encrypt(dataWithHash)
        const encryptedHash = await crypto.sha256(encrypted)

        xorBufferInPlace(aesKey, encryptedHash)
        const decryptedData = Buffer.concat([aesKey, encrypted])

        const decryptedDataBigint = bufferToBigInt(decryptedData)
        if (decryptedDataBigint.geq(keyModulus)) {
            continue
        }

        const encryptedBigint = decryptedDataBigint.modPow(
            keyExponent,
            keyModulus
        )
        return bigIntToBuffer(encryptedBigint, 256)
    }
}

async function rsaEncrypt(
    data: Buffer,
    crypto: ICryptoProvider,
    key: TlPublicKey
): Promise<Buffer> {
    const toEncrypt = Buffer.concat([
        await crypto.sha1(data),
        data,
        // sha1 is always 20 bytes, so we're left with 255 - 20 - x padding
        randomBytes(235 - data.length),
    ])

    const encryptedBigInt = bufferToBigInt(toEncrypt).modPow(
        bigInt(key.exponent, 16),
        bigInt(key.modulus, 16)
    )

    return bigIntToBuffer(encryptedBigInt)
}

/**
 * Execute authorization flow on `connection` using `crypto`.
 *
 * Returns tuple: [authKey, serverSalt, timeOffset]
 */
export async function doAuthorization(
    connection: SessionConnection,
    crypto: ICryptoProvider
): Promise<[Buffer, Long, number]> {
    const session = connection['_session']
    const readerMap = session._readerMap
    const writerMap = session._writerMap

    function sendPlainMessage(message: mtp.TlObject): Promise<void> {
        const length = TlSerializationCounter.countNeededBytes(
            writerMap,
            message
        )
        const writer = TlBinaryWriter.alloc(writerMap, length + 20) // 20 bytes for mtproto header

        const messageId = session.getMessageId()

        writer.long(Long.ZERO)
        writer.long(messageId)
        writer.uint(length)
        writer.object(message)

        return connection.send(writer.result())
    }

    async function readNext(): Promise<mtp.TlObject> {
        return TlBinaryReader.deserializeObject(
            readerMap,
            await connection.waitForNextMessage(),
            20 // skip mtproto header
        )
    }

    const log = connection.log.create('auth')

    const nonce = randomBytes(16)
    // Step 1: PQ request
    log.debug('starting PQ handshake, nonce = %h', nonce)

    await sendPlainMessage({ _: 'mt_req_pq_multi', nonce })
    const resPq = await readNext()

    if (resPq._ !== 'mt_resPQ') throw new Error('Step 1: answer was ' + resPq._)
    if (!buffersEqual(resPq.nonce, nonce))
        throw new Error('Step 1: invalid nonce from server')

    const serverKeys = resPq.serverPublicKeyFingerprints.map((it) =>
        it.toUnsigned().toString(16)
    )
    log.debug('received PQ, keys: %j', serverKeys)

    // Step 2: DH exchange
    const publicKey = findKeyByFingerprints(serverKeys)
    if (!publicKey)
        throw new Error(
            'Step 2: Could not find server public key with any of these fingerprints: ' +
                serverKeys.join(', ')
        )
    log.debug(
        'found server key, fp = %s, old = %s',
        publicKey.fingerprint,
        publicKey.old
    )

    const [p, q] = await crypto.factorizePQ(resPq.pq)
    log.debug('factorized PQ: PQ = %h, P = %h, Q = %h', resPq.pq, p, q)

    const newNonce = randomBytes(32)

    let dcId = connection.params.dc.id
    if (connection.params.testMode) dcId += 10000
    if (connection.params.dc.mediaOnly) dcId = -dcId

    const _pqInnerData: mtp.RawMt_p_q_inner_data_dc = {
        _: 'mt_p_q_inner_data_dc',
        pq: resPq.pq,
        p,
        q,
        nonce,
        newNonce,
        serverNonce: resPq.serverNonce,
        dc: dcId,
    }
    const pqInnerData = TlBinaryWriter.serializeObject(writerMap, _pqInnerData)

    const encryptedData = publicKey.old
        ? await rsaEncrypt(pqInnerData, crypto, publicKey)
        : await rsaPad(pqInnerData, crypto, publicKey)

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

    if (!mtp.isAnyServer_DH_Params(serverDhParams))
        throw new Error('Step 2.1: answer was ' + serverDhParams._)

    if (serverDhParams._ !== 'mt_server_DH_params_ok')
        throw new Error('Step 2.1: answer was ' + serverDhParams._)

    if (!buffersEqual(serverDhParams.nonce, nonce))
        throw Error('Step 2: invalid nonce from server')
    if (!buffersEqual(serverDhParams.serverNonce, resPq.serverNonce))
        throw Error('Step 2: invalid server nonce from server')

    // type was removed from schema in July 2021
    // if (serverDhParams._ === 'mt_server_DH_params_fail') {
    //     // why would i want to do that? we are gonna fail anyways.
    //     // let expectedNnh = (await crypto.sha1(newNonce)).slice(4, 20)
    //     // if (!buffersEqual(serverDhParams.newNonceHash, expectedNnh))
    //     //     throw new Error('Step 2: invalid DH fail nonce from server')
    //     throw new Error('Step 2: server DH failed')
    // }

    log.debug('server DH ok')

    if (serverDhParams.encryptedAnswer.length % 16 != 0)
        throw new Error('Step 2: AES block size is invalid')

    // Step 3: complete DH exchange
    const [key, iv] = await generateKeyAndIvFromNonce(
        crypto,
        resPq.serverNonce,
        newNonce
    )
    const ige = crypto.createAesIge(key, iv)

    const plainTextAnswer = await ige.decrypt(serverDhParams.encryptedAnswer)
    const innerDataHash = plainTextAnswer.slice(0, 20)
    const serverDhInnerReader = new TlBinaryReader(
        readerMap,
        plainTextAnswer,
        20
    )
    const serverDhInner = serverDhInnerReader.object() as mtp.TlObject

    if (
        !buffersEqual(
            innerDataHash,
            await crypto.sha1(
                plainTextAnswer.slice(20, serverDhInnerReader.pos)
            )
        )
    )
        throw new Error('Step 3: invalid inner data hash')

    if (serverDhInner._ !== 'mt_server_DH_inner_data')
        throw Error('Step 3: inner data was ' + serverDhInner._)
    if (!buffersEqual(serverDhInner.nonce, nonce))
        throw Error('Step 3: invalid nonce from server')
    if (!buffersEqual(serverDhInner.serverNonce, resPq.serverNonce))
        throw Error('Step 3: invalid server nonce from server')

    const dhPrime = bufferToBigInt(serverDhInner.dhPrime)
    const timeOffset = Math.floor(Date.now() / 1000) - serverDhInner.serverTime

    // dhPrime is not checked because who cares lol :D

    const g = bigInt(serverDhInner.g)
    const gA = bufferToBigInt(serverDhInner.gA)

    let retryId = Long.ZERO
    const serverSalt = xorBuffer(
        newNonce.slice(0, 8),
        resPq.serverNonce.slice(0, 8)
    )

    for (;;) {
        const b = bufferToBigInt(randomBytes(256))
        const gB = g.modPow(b, dhPrime)

        const authKey = bigIntToBuffer(gA.modPow(b, dhPrime))
        const authKeyAuxHash = (await crypto.sha1(authKey)).slice(0, 8)

        // validate DH params
        if (g.lesserOrEquals(1) || g.greaterOrEquals(dhPrime.minus(bigInt.one)))
            throw new Error('g is not within (1, dh_prime - 1)')
        if (
            gA.lesserOrEquals(1) ||
            gA.greaterOrEquals(dhPrime.minus(bigInt.one))
        )
            throw new Error('g_a is not within (1, dh_prime - 1)')
        if (
            gB.lesserOrEquals(1) ||
            gB.greaterOrEquals(dhPrime.minus(bigInt.one))
        )
            throw new Error('g_b is not within (1, dh_prime - 1)')

        if (gA.lt(DH_SAFETY_RANGE) || gA.gt(dhPrime.minus(DH_SAFETY_RANGE)))
            throw new Error(
                'g_a is not within (2^{2048-64}, dh_prime - 2^{2048-64})'
            )
        if (gB.lt(DH_SAFETY_RANGE) || gB.gt(dhPrime.minus(DH_SAFETY_RANGE)))
            throw new Error(
                'g_b is not within (2^{2048-64}, dh_prime - 2^{2048-64})'
            )

        const gB_buf = bigIntToBuffer(gB, 0, false)

        // Step 4: send client DH
        const clientDhInner: mtp.RawMt_client_DH_inner_data = {
            _: 'mt_client_DH_inner_data',
            nonce,
            serverNonce: resPq.serverNonce,
            retryId,
            gB: gB_buf,
        }
        let innerLength =
            TlSerializationCounter.countNeededBytes(writerMap, clientDhInner) +
            20 // for hash
        const innerPaddingLength = innerLength % 16
        if (innerPaddingLength > 0) innerLength += 16 - innerPaddingLength

        const clientDhInnerWriter = TlBinaryWriter.alloc(writerMap, innerLength)
        clientDhInnerWriter.pos = 20
        clientDhInnerWriter.object(clientDhInner)
        const clientDhInnerHash = await crypto.sha1(
            clientDhInnerWriter.buffer.slice(20, clientDhInnerWriter.pos)
        )
        clientDhInnerWriter.pos = 0
        clientDhInnerWriter.raw(clientDhInnerHash)

        log.debug('sending client DH (timeOffset = %d)', timeOffset)

        const clientDhEncrypted = await ige.encrypt(clientDhInnerWriter.buffer)
        await sendPlainMessage({
            _: 'mt_set_client_DH_params',
            nonce,
            serverNonce: resPq.serverNonce,
            encryptedData: clientDhEncrypted,
        })

        const dhGen = await readNext()
        if (!mtp.isAnySet_client_DH_params_answer(dhGen))
            throw new Error('Step 4: answer was ' + dhGen._)

        if (!buffersEqual(dhGen.nonce, nonce))
            throw Error('Step 4: invalid nonce from server')
        if (!buffersEqual(dhGen.serverNonce, resPq.serverNonce))
            throw Error('Step 4: invalid server nonce from server')

        log.debug('DH result: %s', dhGen._)

        if (dhGen._ === 'mt_dh_gen_fail') {
            // in theory i would be supposed to calculate newNonceHash, but why, we are failing anyway
            throw new Error('Step 4: server DH returned failure')
        }

        if (dhGen._ === 'mt_dh_gen_retry') {
            const expectedHash = await crypto.sha1(
                Buffer.concat([newNonce, Buffer.from([2]), authKeyAuxHash])
            )
            if (!buffersEqual(expectedHash.slice(4, 20), dhGen.newNonceHash2))
                throw Error('Step 4: invalid retry nonce hash from server')
            retryId = Long.fromBytesLE(authKeyAuxHash as any)
            continue
        }

        if (dhGen._ !== 'mt_dh_gen_ok') throw new Error() // unreachable

        const expectedHash = await crypto.sha1(
            Buffer.concat([newNonce, Buffer.from([1]), authKeyAuxHash])
        )
        if (!buffersEqual(expectedHash.slice(4, 20), dhGen.newNonceHash1))
            throw Error('Step 4: invalid nonce hash from server')

        log.info('authorization successful')

        return [
            authKey,
            new Long(serverSalt.readInt32LE(), serverSalt.readInt32LE(4)),
            timeOffset,
        ]
    }
}
