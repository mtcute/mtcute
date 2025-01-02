import type { GramjsSession } from './types.js'
import { utf8 } from '@fuman/utils'
import { basename, type INodeFsLike, joinPaths } from '../utils/fs.js'

export async function readGramjsStoreSession(
    path: string,
    params?: {
        /** filesystem implementation to use (defaults to `node:fs/promises`) */
        fs?: INodeFsLike
    },
): Promise<GramjsSession> {
    const fs: INodeFsLike = params?.fs ?? (await import('node:fs/promises') as unknown as INodeFsLike)

    const sessionName = basename(path)

    const [fAuthKey, fDcId, fIpAddress, fPort] = await Promise.all([
        fs.readFile(joinPaths(path, `${sessionName}%3AauthKey`)),
        fs.readFile(joinPaths(path, `${sessionName}%3AdcId`)),
        fs.readFile(joinPaths(path, `${sessionName}%3AserverAddress`)),
        fs.readFile(joinPaths(path, `${sessionName}%3Aport`)),
    ])

    const authKeyParsed = JSON.parse(utf8.decoder.decode(fAuthKey)) as unknown
    // we expect a `Buffer` serialization
    if (
        (typeof authKeyParsed !== 'object' || authKeyParsed === null)
        || !('type' in authKeyParsed)
        || authKeyParsed.type !== 'Buffer'
        || !('data' in authKeyParsed)
        || !Array.isArray(authKeyParsed.data)
    ) {
        throw new Error('Invalid auth key file')
    }

    const authKey = new Uint8Array(authKeyParsed.data as number[])
    if (authKey.length !== 256) {
        throw new Error('Invalid auth key length')
    }

    const dcId = Number.parseInt(utf8.decoder.decode(fDcId))
    if (Number.isNaN(dcId)) {
        throw new TypeError('Invalid dc id')
    }

    const port = Number.parseInt(utf8.decoder.decode(fPort))
    if (Number.isNaN(port)) {
        throw new TypeError('Invalid port')
    }

    const ip = JSON.parse(utf8.decoder.decode(fIpAddress)) as unknown
    if (typeof ip !== 'string') {
        throw new TypeError('Invalid server address')
    }

    return {
        dcId,
        ipAddress: ip,
        ipv6: ip.includes(':'), // dumb check but gramjs does this
        port,
        authKey,
    }
}

export async function writeGramjsStoreSession(
    path: string,
    session: GramjsSession,
    params?: {
        /** filesystem implementation to use (defaults to `node:fs/promises`) */
        fs?: INodeFsLike
    },
): Promise<void> {
    const fs: INodeFsLike = params?.fs ?? (await import('node:fs/promises') as unknown as INodeFsLike)

    const sessionName = basename(path)

    await fs.mkdir(sessionName, { recursive: true })

    await Promise.all([
        fs.writeFile(
            joinPaths(path, `${sessionName}%3AauthKey`),
            utf8.encoder.encode(JSON.stringify({
                type: 'Buffer',
                data: Array.from(session.authKey),
            })),
        ),
        fs.writeFile(joinPaths(path, `${sessionName}%3AdcId`), utf8.encoder.encode(session.dcId.toString())),
        fs.writeFile(joinPaths(path, `${sessionName}%3AserverAddress`), utf8.encoder.encode(JSON.stringify(session.ipAddress))),
        fs.writeFile(joinPaths(path, `${sessionName}%3Aport`), utf8.encoder.encode(session.port.toString())),
    ])
}
