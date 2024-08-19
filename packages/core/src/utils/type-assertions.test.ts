import { describe, expect, it } from 'vitest'

import {
    assertTypeIs,
    assertTypeIsNot,
    hasValueAtKey,
    isPresent,
    mtpAssertTypeIs,
} from './type-assertions.js'

describe('isPresent', () => {
    it('should return true for non-null values', () => {
        expect(isPresent(1)).toBe(true)
        expect(isPresent('')).toBe(true)
        expect(isPresent({})).toBe(true)
        expect(isPresent([])).toBe(true)
    })

    it('should return false for null/undefined', () => {
        expect(isPresent(null)).toBe(false)
        expect(isPresent(undefined)).toBe(false)
    })
})

describe('hasValueAtKey', () => {
    it('should return true for objects with the correct value', () => {
        expect(hasValueAtKey('a', 1)({ a: 1 })).toBe(true)
        expect(hasValueAtKey('a', 1)({ a: 1, b: 2 })).toBe(true)
    })

    it('should return false for objects with the wrong value', () => {
        expect(hasValueAtKey('a', 1)({ a: 2 })).toBe(false)
        expect(hasValueAtKey('a', 1)({ a: 2, b: 2 })).toBe(false)
    })

    it('should return false for objects without the key', () => {
        // @ts-expect-error - we want to make sure the key is not present at runtime
        expect(hasValueAtKey('a', 1)({ b: 2 })).toBe(false)
    })
})

describe('assertTypeIs', () => {
    it('should not throw for correct types', () => {
        assertTypeIs('peerUser', { _: 'peerUser', userId: 1 }, 'peerUser')
        mtpAssertTypeIs('peerUser', { _: 'mt_rpc_answer_unknown' }, 'mt_rpc_answer_unknown')
    })

    it('should throw for incorrect types', () => {
        expect(() => assertTypeIs('peerUser', { _: 'peerChannel', channelId: 1 } as any, 'peerUser')).toThrow()

        expect(() => mtpAssertTypeIs('peerUser', { _: 'mt_rpc_answer_unknown' } as any, 'peerUser')).toThrow()
    })
})

describe('assertTypeIsNot', () => {
    it('should not throw for correct types', () => {
        assertTypeIsNot('peerUser', { _: 'peerChannel', channelId: 1 } as any, 'peerUser')
    })

    it('should throw for incorrect types', () => {
        expect(() => assertTypeIsNot('peerUser', { _: 'peerUser', userId: 1 }, 'peerUser')).toThrow()
    })
})
