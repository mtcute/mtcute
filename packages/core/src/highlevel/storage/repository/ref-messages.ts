import { MaybePromise } from '../../../types/utils.js'

export interface IReferenceMessagesRepository {
    /** Store a reference message */
    store(peerId: number, chatId: number, msgId: number): MaybePromise<void>
    /**
     * Get the reference message for the given `peerId`.
     *
     * If more than one reference message is stored for the given `peerId`,
     * the one with the highest `msgId` should be returned, but this is not
     * really important.
     */
    getByPeer(peerId: number): MaybePromise<[number, number] | null>

    /**
     * Delete reference messages given the `chatId`
     * where `msgId` is one of `msgIds`
     */
    delete(chatId: number, msgIds: number[]): MaybePromise<void>
    deleteByPeer(peerId: number): MaybePromise<void>
    deleteAll(): MaybePromise<void>
}
