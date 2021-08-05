import { MaybeDynamic, Message, MtClientError } from '../types'
import { BigInteger } from 'big-integer'
import { randomBytes, bufferToBigInt } from '@mtcute/core'
import { tl } from '@mtcute/tl'

export const EMPTY_BUFFER = Buffer.alloc(0)

export function normalizePhoneNumber(phone: string): string {
    phone = phone.trim().replace(/[+()\s-]/g, '')
    if (!phone.match(/^\d+$/)) throw new MtClientError('Invalid phone number')

    return phone
}

export async function resolveMaybeDynamic<T>(val: MaybeDynamic<T>): Promise<T> {
    return val instanceof Function ? await val() : await val
}

export function randomUlong(): BigInteger {
    return bufferToBigInt(randomBytes(8))
}

export function extractChannelIdFromUpdate(
    upd: tl.TypeUpdate
): number | undefined {
    // holy shit
    const res =
        'channelId' in upd
            ? upd.channelId
            : 'message' in upd &&
              typeof upd.message !== 'string' &&
              'peerId' in upd.message &&
              upd.message.peerId &&
              'channelId' in upd.message.peerId
            ? upd.message.peerId.channelId
            : undefined
    if (res === 0) return undefined
    return res
}

export function normalizeDate(
    date: Date | number | undefined
): number | undefined {
    return date
        ? ~~((typeof date === 'number' ? date : date.getTime()) / 1000)
        : undefined
}

export function normalizeMessageId(
    msg: Message | number | undefined
): number | undefined {
    return msg ? (typeof msg === 'number' ? msg : msg.id) : undefined
}
