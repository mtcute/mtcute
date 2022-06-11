import { IEncryptionScheme, ICryptoProvider } from './abstract'

// returns tuple: [key, iv]
export async function generateKeyAndIvFromNonce(
    crypto: ICryptoProvider,
    serverNonce: Buffer,
    newNonce: Buffer
): Promise<[Buffer, Buffer]> {
    const hash1 = await crypto.sha1(Buffer.concat([newNonce, serverNonce]))
    const hash2 = await crypto.sha1(Buffer.concat([serverNonce, newNonce]))
    const hash3 = await crypto.sha1(Buffer.concat([newNonce, newNonce]))

    const key = Buffer.concat([hash1, hash2.slice(0, 12)])
    const iv = Buffer.concat([hash2.slice(12, 20), hash3, newNonce.slice(0, 4)])

    return [key, iv]
}

export async function createAesIgeForMessage(
    crypto: ICryptoProvider,
    authKey: Buffer,
    messageKey: Buffer,
    client: boolean
): Promise<IEncryptionScheme> {
    const x = client ? 0 : 8
    const sha256a = await crypto.sha256(
        Buffer.concat([messageKey, authKey.slice(x, 36 + x)])
    )
    const sha256b = await crypto.sha256(
        Buffer.concat([authKey.slice(40 + x, 76 + x), messageKey])
    )

    const key = Buffer.concat([
        sha256a.slice(0, 8),
        sha256b.slice(8, 24),
        sha256a.slice(24, 32),
    ])
    const iv = Buffer.concat([
        sha256b.slice(0, 8),
        sha256a.slice(8, 24),
        sha256b.slice(24, 32),
    ])

    return crypto.createAesIge(key, iv)
}

export async function createAesIgeForMessageOld(
    crypto: ICryptoProvider,
    authKey: Buffer,
    messageKey: Buffer,
    client: boolean
): Promise<IEncryptionScheme> {
    const x = client ? 0 : 8
    const sha1a = await crypto.sha1(
        Buffer.concat([messageKey, authKey.slice(x, 32 + x)])
    )
    const sha1b = await crypto.sha1(
        Buffer.concat([authKey.slice(32 + x, 48 + x), messageKey, authKey.slice(48 + x, 64 + x)])
    )
    const sha1c = await crypto.sha1(
        Buffer.concat([authKey.slice(64 + x, 96 + x), messageKey])
    )
    const sha1d = await crypto.sha1(
        Buffer.concat([messageKey, authKey.slice(96 + x, 128 + x)])
    )

    const key = Buffer.concat([
        sha1a.slice(0, 8),
        sha1b.slice(8, 20),
        sha1c.slice(4, 16),
    ])
    const iv = Buffer.concat([
        sha1a.slice(8, 20),
        sha1b.slice(0, 8),
        sha1c.slice(16, 20),
        sha1d.slice(0, 8),
    ])

    return crypto.createAesIge(key, iv)
}
