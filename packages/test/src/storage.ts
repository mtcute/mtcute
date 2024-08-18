import { MemoryStorage, MtArgumentError } from '@mtcute/core'
import type { ICryptoProvider } from '@mtcute/core/utils.js'
import { createAesIgeForMessage } from '@mtcute/core/utils.js'

export class StubMemoryTelegramStorage extends MemoryStorage {
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
        } = {
            hasKeys: true,
            hasTempKeys: true,
        },
    ) {
        super()

        const _origGet = this.authKeys.get

        this.authKeys.get = (dcId) => {
            if (this.params.hasKeys) {
                if (this.params.hasKeys === true || this.params.hasKeys.includes(dcId)) {
                    return new Uint8Array(256)
                }
            }

            return _origGet.call(this.authKeys, dcId)
        }

        const _origGetTemp = this.authKeys.getTemp

        this.authKeys.getTemp = (dcId, idx, now) => {
            if (this.params.hasTempKeys) {
                if (this.params.hasTempKeys === true || this.params.hasTempKeys.includes(dcId)) {
                    return new Uint8Array(256)
                }
            }

            return _origGetTemp.call(this.authKeys, dcId, idx, now)
        }
    }

    decryptOutgoingMessage(
        crypto: ICryptoProvider,
        data: Uint8Array,
        dcId: number,
        tempIndex?: number | undefined,
    ): Uint8Array {
        const key = tempIndex ? this.authKeys.getTemp(dcId, tempIndex, Date.now()) : this.authKeys.get(dcId)

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
