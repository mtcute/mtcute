import { ITelegramStorage, MemoryStorage, MtArgumentError } from '@mtcute/core'
import { createAesIgeForMessage, ICryptoProvider } from '@mtcute/core/utils.js'

export class StubMemoryTelegramStorage extends MemoryStorage implements ITelegramStorage {
    constructor(
        readonly params: {
            /**
             * IDs of the DCs for which the storage should have auth keys,
             * or `true` to have keys for all DCs
             *
             * @default true
             */
            hasKeys?: boolean | number[]

            /**
             * IDs of the DCs for which the storage should have temp auth keys,
             * or `true` to have keys for all DCs
             *
             * @default true
             */
            hasTempKeys?: boolean | number[]

            onLoad?: () => void
            onSave?: () => void
            onDestroy?: () => void
            onReset?: () => void
        } = {
            hasKeys: true,
            hasTempKeys: true,
        },
    ) {
        super()
    }

    getAuthKeyFor(dcId: number, tempIndex?: number | undefined): Uint8Array | null {
        if (tempIndex === undefined && this.params.hasKeys) {
            if (this.params.hasKeys === true || this.params.hasKeys.includes(dcId)) {
                return new Uint8Array(256)
            }
        }

        if (tempIndex === undefined && this.params.hasTempKeys) {
            if (this.params.hasTempKeys === true || this.params.hasTempKeys.includes(dcId)) {
                return new Uint8Array(256)
            }
        }

        return super.getAuthKeyFor(dcId, tempIndex)
    }

    load(): void {
        this.params.onLoad?.()
        super.load()
    }

    save(): void {
        this.params.onSave?.()
    }

    destroy(): void {
        this.params.onDestroy?.()
        super.destroy()
    }

    reset(): void {
        this.params?.onReset?.()
        super.reset()
    }

    decryptOutgoingMessage(crypto: ICryptoProvider, data: Uint8Array, dcId: number, tempIndex?: number | undefined) {
        const key = this.getAuthKeyFor(dcId, tempIndex)

        if (!key) {
            throw new MtArgumentError(`No auth key for DC ${dcId}`)
        }

        const messageKey = data.subarray(8, 24)
        const encryptedData = data.subarray(24)

        const ige = createAesIgeForMessage(crypto, key, messageKey, true)
        const innerData = ige.decrypt(encryptedData)

        // skipping all checks because who cares
        const dv = new DataView(innerData.buffer, innerData.byteOffset, innerData.byteLength)
        const length = dv.getUint32(28, true)

        return innerData.subarray(32, 32 + length)
    }
}
