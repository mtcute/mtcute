import { MtArgumentError } from '../../types/errors.js'
import { ArrayPaginated, ArrayWithTotal, MaybeDynamic, Message } from '../types/index.js'

/**
 * Normalize phone number by stripping formatting
 * @param phone  Phone number
 */
export function normalizePhoneNumber(phone: string): string {
    phone = phone.trim().replace(/[+()\s-]/g, '')
    if (!phone.match(/^\d+$/)) throw new MtArgumentError('Invalid phone number')

    return phone
}

export async function resolveMaybeDynamic<T>(val: MaybeDynamic<T>): Promise<T> {
    return val instanceof Function ? await val() : await val
}

export function makeArrayWithTotal<T>(arr: T[], total: number): ArrayWithTotal<T> {
    const a = arr as ArrayWithTotal<T>
    a.total = total

    return a
}

export function makeArrayPaginated<T, Offset>(arr: T[], total: number, next?: Offset): ArrayPaginated<T, Offset> {
    const a = arr as ArrayPaginated<T, Offset>
    a.total = total
    a.next = next

    return a
}

export function normalizeDate(date: Date | number): number
export function normalizeDate(date: Date | number | undefined): number | undefined

export function normalizeDate(date: Date | number | undefined): number | undefined {
    return date ? ~~((typeof date === 'number' ? date : date.getTime()) / 1000) : undefined
}

export function normalizeMessageId(msg: Message | number | undefined): number | undefined {
    if (!msg) return undefined

    return typeof msg === 'number' ? msg : msg.id
}
