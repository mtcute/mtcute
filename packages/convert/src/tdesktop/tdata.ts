import { dirname, join } from 'node:path/posix'

import { Bytes, read, write } from '@fuman/io'
import type { UnsafeMutable } from '@fuman/utils'
import { typed, u8, utf8 } from '@fuman/utils'
import { createAesIgeForMessageOld } from '@mtcute/core/utils.js'
import { Long, MtUnsupportedError } from '@mtcute/core'

import type { INodeFsLike } from '../utils/fs.js'
import { type IExtendedCryptoProvider, getDefaultCryptoProvider } from '../utils/crypto.js'

import { readLong, readQByteArray } from './qt-reader.js'
import type { InputTdKeyData, TdAuthKey, TdKeyData, TdMtpAuthorization } from './types.js'
import { writeLong, writeQByteArray } from './qt-writer.js'

const TDF_MAGIC = /* #__PURE__ */ utf8.encoder.encode('TDF$')
const TDF_VERSION = 5008003
const MTP_AUTHORIZATION_BLOCK = 0x4B // see https://github.com/telegramdesktop/tdesktop/blob/dev/Telegram/SourceFiles/storage/details/storage_settings_scheme.h
const HEX_ALPHABET = '0123456789ABCDEF'

function toFilePart(key: Uint8Array): string {
    let str = ''
    // we need to swap nibbles for whatever reason
    for (let i = 0; i < 8; i++) {
        const b = key[i]
        const low = b & 0x0F
        const high = b >> 4
        str += HEX_ALPHABET[low] + HEX_ALPHABET[high]
    }
    return str
}

export interface TdataOptions {
    /** Full path to the tdata directory */
    path: string

    /**
     * File system to use for reading/writing.
     *
     * @default  `import('node:fs/promises')`
     */
    fs?: INodeFsLike

    /**
     * Crypto functions to use for encryption/decryption.
     *
     * @default  `node:crypto`-based implementation
     */
    crypto?: IExtendedCryptoProvider

    /**
     * Whether to ignore TDF version mismatch.
     * If set to `true`, the version will be ignored and the file will be read as is,
     * however the probability of errors is higher.
     */
    ignoreVersion?: boolean

    /**
     * Whether the host machine has LE processor (default true, try changing in case of errors)
     */
    le?: boolean

    /**
     * Value of -key cli parameter.
     * Defaults to `data`
     */
    dataKey?: string

    /**
     * Local passcode
     */
    passcode?: string
}

export class Tdata {
    private constructor(
        readonly options: TdataOptions,
        readonly fs: INodeFsLike,
        readonly crypto: IExtendedCryptoProvider,
    ) {}

    readonly keyData!: TdKeyData

    static async open(options: TdataOptions): Promise<Tdata> {
        const fs: INodeFsLike = options.fs ?? (await import('node:fs/promises') as unknown as INodeFsLike)
        const crypto: IExtendedCryptoProvider = options.crypto ?? (await getDefaultCryptoProvider())
        await crypto.initialize?.()

        const tdata = new Tdata(options, fs, crypto)
        ;(tdata as UnsafeMutable<Tdata>).keyData = await tdata.readKeyData()

        return tdata
    }

    static async create(options: TdataOptions & { keyData: InputTdKeyData }): Promise<Tdata> {
        const fs: INodeFsLike = options.fs ?? (await import('node:fs/promises') as unknown as INodeFsLike)
        const crypto: IExtendedCryptoProvider = options.crypto ?? (await getDefaultCryptoProvider())
        await crypto.initialize?.()

        const tdata = new Tdata(options, fs, crypto)
        const keyData: TdKeyData = {
            ...options.keyData,
            localKey: options.keyData.localKey ?? crypto.randomBytes(256),
            version: options.keyData.version ?? TDF_VERSION,
        }
        ;(tdata as UnsafeMutable<Tdata>).keyData = keyData

        await tdata.writeKeyData(keyData)

        return tdata
    }

    #readInt32(buf: Uint8Array): number {
        return (this.options.le ?? true) ? read.int32le(buf) : read.int32be(buf)
    }

    #writeInt32(buf: Uint8Array, val: number): Uint8Array {
        if (this.options.le ?? true) {
            write.int32le(buf, val)
        } else {
            write.int32be(buf, val)
        }

        return buf
    }

    getDataName(idx: number): string {
        let res = this.options.dataKey ?? 'data'

        if (idx > 0) {
            res += `#${idx + 1}`
        }

        return res
    }

    async readFile(filename: string): Promise<[number, Uint8Array]> {
        const order: string[] = []

        const modern = `${filename}s`
        if (await this.fs.stat(join(this.options.path, modern))) {
            order.push(modern)
        } else {
            const try0 = `${filename}0`
            const try1 = `${filename}1`

            const try0s = await this.fs.stat(join(this.options.path, try0))
            const try1s = await this.fs.stat(join(this.options.path, try1))

            if (try0s) {
                order.push(try0)

                if (try1s) {
                    order.push(try1)
                    if (try0s.lastModified < try1s.lastModified) {
                        order.reverse()
                    }
                }
            } else if (try1s) {
                order.push(try1)
            }
        }

        let lastError = 'file not found'

        for (const file of order) {
            const data = await this.fs.readFile(join(this.options.path, file))
            const magic = data.subarray(0, 4)

            if (!typed.equal(magic, TDF_MAGIC)) {
                lastError = 'invalid magic'
                continue
            }

            const versionBytes = data.subarray(4, 8)
            const version = this.#readInt32(versionBytes)
            if (version > TDF_VERSION && !this.options.ignoreVersion) {
                lastError = `Unsupported version: ${version}`
                continue
            }

            const dataSize = data.length - 24
            const bytes = data.subarray(8, dataSize + 8)

            const md5 = await this.crypto.createHash('md5')
            await md5.update(bytes)
            await md5.update(this.#writeInt32(u8.alloc(4), dataSize))
            await md5.update(versionBytes)
            await md5.update(magic)

            const hash = await md5.digest()
            if (!typed.equal(hash, data.subarray(dataSize + 8))) {
                lastError = 'md5 mismatch'
                continue
            }

            return [version, bytes]
        }

        throw new Error(`failed to read ${filename}, last error: ${lastError}`)
    }

    async writeFile(
        filename: string,
        data: Uint8Array,
        mkdir = false,
    ): Promise<void> {
        filename = join(this.options.path, `${filename}s`)

        const version = this.#writeInt32(u8.alloc(4), TDF_VERSION)
        const dataSize = this.#writeInt32(u8.alloc(4), data.length)
        const md5 = await this.crypto.createHash('md5')
        await md5.update(data)
        await md5.update(dataSize)
        await md5.update(version)
        await md5.update(TDF_MAGIC)

        if (mkdir) {
            await this.fs.mkdir(dirname(filename), { recursive: true })
        }

        await this.fs.writeFile(
            filename,
            u8.concat([TDF_MAGIC, version, data, await md5.digest()]),
        )
    }

    async createLocalKey(
        salt: Uint8Array,
        passcode: string = this.options.passcode ?? '',
    ): Promise<Uint8Array> {
        const hasher = await this.crypto.createHash('sha512')
        await hasher.update(salt)
        await hasher.update(utf8.encoder.encode(passcode))
        await hasher.update(salt)
        const hash = await hasher.digest()

        return this.crypto.pbkdf2(
            hash,
            salt,
            passcode === '' ? 1 : 100000,
            256,
            'sha512',
        )
    }

    async decryptLocal(encrypted: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
        const encryptedKey = encrypted.subarray(0, 16)
        const encryptedData = encrypted.subarray(16)

        const ige = createAesIgeForMessageOld(
            this.crypto,
            key,
            encryptedKey,
            false,
        )
        const decrypted = ige.decrypt(encryptedData)

        if (
            !typed.equal(
                this.crypto.sha1(decrypted).subarray(0, 16),
                encryptedKey,
            )
        ) {
            throw new Error('Failed to decrypt, invalid password?')
        }

        const fullLen = encryptedData.length
        const dataLen = this.#readInt32(decrypted)

        if (
            dataLen > decrypted.length
            || dataLen <= fullLen - 16
            || dataLen < 4
        ) {
            throw new Error('Failed to decrypt, invalid data length')
        }

        return decrypted.subarray(4, dataLen)
    }

    async encryptLocal(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
        const dataSize = data.length + 4
        const padding: Uint8Array
            = dataSize & 0x0F
                ? this.crypto.randomBytes(0x10 - (dataSize & 0x0F))
                : u8.empty

        const toEncrypt = u8.alloc(dataSize + padding.length)
        this.#writeInt32(toEncrypt, dataSize)
        toEncrypt.set(data, 4)
        toEncrypt.set(padding, dataSize)

        const encryptedKey = this.crypto.sha1(toEncrypt).subarray(0, 16)

        const ige = createAesIgeForMessageOld(
            this.crypto,
            key,
            encryptedKey,
            false,
        )
        const encryptedData = ige.encrypt(toEncrypt)

        return u8.concat2(encryptedKey, encryptedData)
    }

    async readKeyData(): Promise<TdKeyData> {
        const [version, data] = await this.readFile(`key_${this.options.dataKey ?? 'data'}`)
        const bytes = Bytes.from(data)

        const salt = readQByteArray(bytes)
        const keyEncrypted = readQByteArray(bytes)
        const infoEncrypted = readQByteArray(bytes)

        const passcodeKey = await this.createLocalKey(salt)
        const keyInnerData = await this.decryptLocal(keyEncrypted, passcodeKey)
        const infoDecrypted = await this.decryptLocal(
            infoEncrypted,
            keyInnerData,
        )
        const info = Bytes.from(infoDecrypted)

        const localKey = keyInnerData
        const count = read.int32be(info)
        const order = [...Array<number>(count)].map(() => read.int32be(info))
        const active = read.int32be(info)

        return {
            version,
            localKey,
            count,
            order,
            active,
        }
    }

    async writeKeyData(keyData: TdKeyData): Promise<void> {
        const info = Bytes.alloc()
        write.int32be(info, keyData.count)
        keyData.order.forEach(i => write.int32be(info, i))
        write.int32be(info, keyData.active)
        const infoDecrypted = info.result()

        const infoEncrypted = await this.encryptLocal(infoDecrypted, keyData.localKey)

        const salt = this.crypto.randomBytes(32)
        const passcodeKey = await this.createLocalKey(salt)

        const keyEncrypted = await this.encryptLocal(keyData.localKey, passcodeKey)

        const data = Bytes.alloc()
        writeQByteArray(data, salt)
        writeQByteArray(data, keyEncrypted)
        writeQByteArray(data, infoEncrypted)

        await this.writeFile(`key_${this.options.dataKey ?? 'data'}`, data.result(), true)
    }

    async computeDataNameKey(accountIdx: number): Promise<Uint8Array> {
        const md5 = await this.crypto.createHash('md5')
        await md5.update(utf8.encoder.encode(this.getDataName(accountIdx)))
        const r = await md5.digest()
        return r.subarray(0, 8)
    }

    async computeDataNameKeyHex(accountIdx: number): Promise<string> {
        return toFilePart(await this.computeDataNameKey(accountIdx))
    }

    async readEncryptedFile(filename: string): Promise<[number, Uint8Array]> {
        const [version, data] = await this.readFile(filename)

        const encrypted = readQByteArray(Bytes.from(data))
        const decrypted = await this.decryptLocal(encrypted, this.keyData.localKey)

        return [version, decrypted]
    }

    async writeEncryptedFile(
        filename: string,
        data: Uint8Array,
        mkdir = false,
    ): Promise<void> {
        const encryptedInner = await this.encryptLocal(data, this.keyData.localKey)

        const writer = Bytes.alloc(data.length + 4)
        writeQByteArray(writer, encryptedInner)

        await this.writeFile(filename, writer.result(), mkdir)
    }

    async readMtpAuthorization(accountIdx: number = 0): Promise<TdMtpAuthorization> {
        const [, mtpData] = await this.readEncryptedFile(
            await this.computeDataNameKeyHex(accountIdx),
        )

        // nb: this is pretty much a hack that relies on the fact that
        // most of the time the mtp auth data is in the first setting
        // since the settings are not length-prefixed, we can't skip unknown settings,
        // as we need to know their type.
        // and this is very much tied to the actual tdesktop version, and would be a nightmare to maintain
        let bytes = Bytes.from(mtpData)

        const header = read.int32be(bytes)
        if (header !== MTP_AUTHORIZATION_BLOCK) {
            throw new MtUnsupportedError(`expected first setting to be mtp auth data, got 0x${header.toString(16)}`)
        }

        const mtpAuthBlock = readQByteArray(bytes)

        bytes = Bytes.from(mtpAuthBlock)

        const legacyUserId = read.int32be(bytes)
        const legacyMainDcId = read.int32be(bytes)

        let userId, mainDcId
        if (legacyMainDcId === -1 && legacyMainDcId === -1) {
            userId = readLong(bytes)
            mainDcId = read.int32be(bytes)
        } else {
            userId = Long.fromInt(legacyUserId)
            mainDcId = legacyMainDcId
        }

        function readKeys(target: TdAuthKey[]) {
            const count = read.uint32be(bytes)

            for (let i = 0; i < count; i++) {
                const dcId = read.int32be(bytes)
                const key = read.exactly(bytes, 256)
                target.push({ dcId, key })
            }
        }

        const authKeys: TdAuthKey[] = []
        const authKeysToDestroy: TdAuthKey[] = []

        readKeys(authKeys)
        readKeys(authKeysToDestroy)

        return {
            userId,
            mainDcId,
            authKeys,
            authKeysToDestroy,
        }
    }

    async writeMtpAuthorization(auth: TdMtpAuthorization, accountIdx = 0): Promise<void> {
        const bytes = Bytes.alloc()

        // legacy user id & dc id
        write.int32be(bytes, -1)
        write.int32be(bytes, -1)
        writeLong(bytes, auth.userId)
        write.int32be(bytes, auth.mainDcId)

        function writeKeys(keys: TdAuthKey[]) {
            write.uint32be(bytes, keys.length)
            keys.forEach((k) => {
                write.int32be(bytes, k.dcId)
                write.bytes(bytes, k.key)
            })
        }

        writeKeys(auth.authKeys)
        writeKeys(auth.authKeysToDestroy)

        const file = Bytes.alloc()
        write.int32be(file, MTP_AUTHORIZATION_BLOCK)
        writeQByteArray(file, bytes.result())

        await this.writeEncryptedFile(
            await this.computeDataNameKeyHex(accountIdx),
            file.result(),
        )
    }

    async writeEmptyMapFile(accountIdx: number): Promise<void> {
        // without this file tdesktop will not "see" the account
        // however just creating an empty file seems to be enough to make it happy

        const writer = Bytes.alloc()
        writeQByteArray(writer, u8.empty) // legacySalt
        writeQByteArray(writer, u8.empty) // legacyKeyEncrypted
        writeQByteArray(writer, await this.encryptLocal(u8.empty, this.keyData.localKey))

        await this.writeFile(
            join(await this.computeDataNameKeyHex(accountIdx), 'map'),
            writer.result(),
            true,
        )
    }
}
