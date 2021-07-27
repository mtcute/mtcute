import { TelegramConnection } from './telegram-connection'
import { buffersEqual, randomBytes, xorBuffer } from '../utils/buffer-utils'
import { tl } from '@mtqt/tl'
import { BinaryReader } from '../utils/binary/binary-reader'
import {
    BinaryWriter,
    SerializationCounter,
} from '../utils/binary/binary-writer'
import { findKeyByFingerprints } from '../utils/crypto/keys'
import { ICryptoProvider } from '../utils/crypto'
import bigInt from 'big-integer'
import { generateKeyAndIvFromNonce } from '../utils/crypto/mtproto'
import {
    bigIntToBuffer,
    bigIntTwo,
    bufferToBigInt,
} from '../utils/bigint-utils'

const debug = require('debug')('mtqt:auth')

// Heavily based on code from https://github.com/LonamiWebs/Telethon/blob/master/telethon/network/authenticator.py

const DH_SAFETY_RANGE = bigIntTwo.pow(2048 - 64)

/**
 * Execute authorization flow on `connection` using `crypto`.
 *
 * Returns tuple: [authKey, serverSalt, timeOffset]
 */
export async function doAuthorization(
    connection: TelegramConnection,
    crypto: ICryptoProvider
): Promise<[Buffer, Buffer, number]> {
    function sendPlainMessage(message: tl.TlObject): Promise<void> {
        const length = SerializationCounter.countNeededBytes(message)
        const writer = BinaryWriter.alloc(length + 20) // 20 bytes for mtproto header

        const messageId = connection['_getMessageId']()

        writer.long(bigInt.zero)
        writer.long(messageId)
        writer.uint32(length)
        writer.object(message)

        return connection.send(writer.result())
    }

    const nonce = randomBytes(16)
    // Step 1: PQ request
    debug(
        '%s: starting PQ handshake, nonce = %h',
        connection.params.dc.ipAddress,
        nonce
    )
    await sendPlainMessage({ _: 'mt_reqPqMulti', nonce })
    const resPq = BinaryReader.deserializeObject(
        await connection.waitForNextMessage(),
        20 // skip mtproto header
    )

    if (resPq._ !== 'mt_resPQ') throw new Error('Step 1: answer was ' + resPq._)
    if (!buffersEqual(resPq.nonce, nonce))
        throw new Error('Step 1: invalid nonce from server')
    debug('%s: received PQ', connection.params.dc.ipAddress)

    // Step 2: DH exchange
    const publicKey = findKeyByFingerprints(resPq.serverPublicKeyFingerprints)
    if (!publicKey)
        throw new Error(
            'Step 2: Could not find server public key with any of these fingerprints: ' +
                resPq.serverPublicKeyFingerprints
                    .map((i) => i.toString(16))
                    .join(', ')
        )
    debug(
        '%s: found server key, fp = %s',
        connection.params.dc.ipAddress,
        publicKey.fingerprint
    )

    const [p, q] = await crypto.factorizePQ(resPq.pq)
    debug('%s: factorized PQ', connection.params.dc.ipAddress)

    const newNonce = randomBytes(32)

    let dcId = connection.params.dc.id
    if (connection.params.testMode) dcId += 10000
    if (connection.params.dc.mediaOnly) dcId = -dcId

    const pqInnerData = BinaryWriter.serializeObject({
        _: 'mt_p_q_inner_data_dc',
        pq: resPq.pq,
        p,
        q,
        nonce,
        newNonce,
        serverNonce: resPq.serverNonce,
        dc: dcId
    } as tl.mtproto.RawP_q_inner_data_dc)
    const encryptedData = await crypto.rsaEncrypt(pqInnerData, publicKey)
    debug('%s: requesting DH params', connection.params.dc.ipAddress)

    await sendPlainMessage({
        _: 'mt_reqDHParams',
        nonce,
        serverNonce: resPq.serverNonce,
        p,
        q,
        publicKeyFingerprint: bigInt(publicKey.fingerprint, 16),
        encryptedData,
    })
    const serverDhParams = BinaryReader.deserializeObject(
        await connection.waitForNextMessage(),
        20 // skip mtproto header
    )

    if (!tl.mtproto.isAnyServer_DH_Params(serverDhParams))
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

    debug('%s: server DH ok', connection.params.dc.ipAddress)

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
    const serverDhInnerReader = new BinaryReader(plainTextAnswer, 20)
    const serverDhInner = serverDhInnerReader.object() as tl.TlObject

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

    let retryId = bigInt.zero
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
        const clientDhInner: tl.mtproto.RawClient_DH_inner_data = {
            _: 'mt_client_DH_inner_data',
            nonce,
            serverNonce: resPq.serverNonce,
            retryId,
            gB: gB_buf,
        }
        let innerLength =
            SerializationCounter.countNeededBytes(clientDhInner) + 20 // for hash
        const innerPaddingLength = innerLength % 16
        if (innerPaddingLength > 0) innerLength += 16 - innerPaddingLength

        const clientDhInnerWriter = BinaryWriter.alloc(innerLength)
        clientDhInnerWriter.pos = 20
        clientDhInnerWriter.object(clientDhInner)
        const clientDhInnerHash = await crypto.sha1(
            clientDhInnerWriter.buffer.slice(20, clientDhInnerWriter.pos)
        )
        clientDhInnerWriter.pos = 0
        clientDhInnerWriter.raw(clientDhInnerHash)

        debug(
            '%s: sending client DH (timeOffset = %d)',
            connection.params.dc.ipAddress,
            timeOffset
        )

        const clientDhEncrypted = await ige.encrypt(clientDhInnerWriter.buffer)
        await sendPlainMessage({
            _: 'mt_setClientDHParams',
            nonce,
            serverNonce: resPq.serverNonce,
            encryptedData: clientDhEncrypted,
        })

        const dhGen = BinaryReader.deserializeObject(
            await connection.waitForNextMessage(),
            20 // skip mtproto header
        )
        if (!tl.mtproto.isAnySet_client_DH_params_answer(dhGen))
            throw new Error('Step 4: answer was ' + dhGen._)

        if (!buffersEqual(dhGen.nonce, nonce))
            throw Error('Step 4: invalid nonce from server')
        if (!buffersEqual(dhGen.serverNonce, resPq.serverNonce))
            throw Error('Step 4: invalid server nonce from server')

        debug('%s: DH result: %s', connection.params.dc.ipAddress, dhGen._)

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
            retryId = bufferToBigInt(authKeyAuxHash)
            continue
        }

        // dhGen._ === 'mt_dh_gen_ok'
        const expectedHash = await crypto.sha1(
            Buffer.concat([newNonce, Buffer.from([1]), authKeyAuxHash])
        )
        if (!buffersEqual(expectedHash.slice(4, 20), dhGen.newNonceHash1))
            throw Error('Step 4: invalid nonce hash from server')

        debug('%s: authorization successful', connection.params.dc.ipAddress)

        return [authKey, serverSalt, timeOffset]
    }
}
