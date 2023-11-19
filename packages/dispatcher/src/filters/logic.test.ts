import { describe, expect, it, vi } from 'vitest'

import { and, not, or } from './logic.js'

describe('filters.not', () => {
    it('should negate a given sync filter', () => {
        const filter = vi.fn().mockReturnValue(true)
        const negated = not(filter)

        expect(negated(1)).toBe(false)
        expect(filter).toHaveBeenCalledTimes(1)
        expect(filter).toHaveBeenCalledWith(1, undefined)
    })

    it('should negate a given async filter', async () => {
        const filter = vi.fn().mockResolvedValue(true)
        const negated = not(filter)

        await expect(negated(1)).resolves.toBe(false)
        expect(filter).toHaveBeenCalledTimes(1)
        expect(filter).toHaveBeenCalledWith(1, undefined)
    })
})

describe('filters.and', () => {
    it.each([
        ['sync', 'sync'],
        ['sync', 'async'],
        ['async', 'sync'],
        ['async', 'async'],
    ])('should combine %s and %s filters', async (aType, bType) => {
        const a = vi.fn().mockReturnValue(aType === 'sync' ? true : Promise.resolve(true))
        const b = vi.fn().mockReturnValue(bType === 'sync' ? true : Promise.resolve(true))

        const combined = and(a, b)

        expect(await combined(1)).toBe(true)
        expect(a).toHaveBeenCalledTimes(1)
        expect(a).toHaveBeenCalledWith(1, undefined)
        expect(b).toHaveBeenCalledTimes(1)
        expect(b).toHaveBeenCalledWith(1, undefined)
    })

    it.each([
        ['sync', 'sync'],
        ['sync', 'async'],
        ['async', 'sync'],
        ['async', 'async'],
    ])('should not continue execution after false (%s and %s filters)', async (aType, bType) => {
        const a = vi.fn().mockReturnValue(aType === 'sync' ? false : Promise.resolve(false))
        const b = vi.fn().mockReturnValue(bType === 'sync' ? true : Promise.resolve(true))

        const combined = and(a, b)

        expect(await combined(1)).toBe(false)
        expect(a).toHaveBeenCalledTimes(1)
        expect(a).toHaveBeenCalledWith(1, undefined)
        expect(b).not.toHaveBeenCalled()
    })

    it.each([
        ['sync', 'sync', 'sync'],
        ['sync', 'sync', 'async'],
        ['sync', 'async', 'sync'],
        ['sync', 'async', 'async'],
        ['async', 'sync', 'sync'],
        ['async', 'sync', 'async'],
        ['async', 'async', 'sync'],
        ['async', 'async', 'async'],
    ])('should combine %s, %s and %s filters', async (aType, bType) => {
        const a = vi.fn().mockReturnValue(aType === 'sync' ? true : Promise.resolve(true))
        const b = vi.fn().mockReturnValue(bType === 'sync' ? true : Promise.resolve(true))
        const c = vi.fn().mockReturnValue(bType === 'sync' ? true : Promise.resolve(true))

        const combined = and(a, b, c)

        expect(await combined(1)).toBe(true)
        expect(a).toHaveBeenCalledTimes(1)
        expect(a).toHaveBeenCalledWith(1, undefined)
        expect(b).toHaveBeenCalledTimes(1)
        expect(b).toHaveBeenCalledWith(1, undefined)
        expect(c).toHaveBeenCalledTimes(1)
        expect(c).toHaveBeenCalledWith(1, undefined)
    })

    it.each([
        ['sync', 'sync', 'sync'],
        ['sync', 'sync', 'async'],
        ['sync', 'async', 'sync'],
        ['sync', 'async', 'async'],
        ['async', 'sync', 'sync'],
        ['async', 'sync', 'async'],
        ['async', 'async', 'sync'],
        ['async', 'async', 'async'],
    ])('should not continue execution after false (%s, %s and %s filters)', async (aType, bType) => {
        const a = vi.fn().mockReturnValue(aType === 'sync' ? true : Promise.resolve(true))
        const b = vi.fn().mockReturnValue(bType === 'sync' ? false : Promise.resolve(false))
        const c = vi.fn().mockReturnValue(bType === 'sync' ? true : Promise.resolve(true))

        const combined = and(a, b, c)

        expect(await combined(1)).toBe(false)
        expect(a).toHaveBeenCalledTimes(1)
        expect(a).toHaveBeenCalledWith(1, undefined)
        expect(b).toHaveBeenCalledTimes(1)
        expect(b).toHaveBeenCalledWith(1, undefined)
        expect(c).not.toHaveBeenCalled()
    })
})

describe('filters.or', () => {
    it.each([
        ['sync', 'sync'],
        ['sync', 'async'],
        ['async', 'sync'],
        ['async', 'async'],
    ])('should combine %s and %s filters', async (aType, bType) => {
        const a = vi.fn().mockReturnValue(aType === 'sync' ? false : Promise.resolve(false))
        const b = vi.fn().mockReturnValue(bType === 'sync' ? false : Promise.resolve(false))

        const combined = or(a, b)

        expect(await combined(1)).toBe(false)
        expect(a).toHaveBeenCalledTimes(1)
        expect(a).toHaveBeenCalledWith(1, undefined)
        expect(b).toHaveBeenCalledTimes(1)
        expect(b).toHaveBeenCalledWith(1, undefined)
    })

    it.each([
        ['sync', 'sync'],
        ['sync', 'async'],
        ['async', 'sync'],
        ['async', 'async'],
    ])('should not continue execution after true (%s and %s filters)', async (aType, bType) => {
        const a = vi.fn().mockReturnValue(bType === 'sync' ? true : Promise.resolve(true))
        const b = vi.fn().mockReturnValue(aType === 'sync' ? false : Promise.resolve(false))

        const combined = or(a, b)

        expect(await combined(1)).toBe(true)
        expect(a).toHaveBeenCalledTimes(1)
        expect(a).toHaveBeenCalledWith(1, undefined)
        expect(b).not.toHaveBeenCalled()
    })

    it.each([
        ['sync', 'sync', 'sync'],
        ['sync', 'sync', 'async'],
        ['sync', 'async', 'sync'],
        ['sync', 'async', 'async'],
        ['async', 'sync', 'sync'],
        ['async', 'sync', 'async'],
        ['async', 'async', 'sync'],
        ['async', 'async', 'async'],
    ])('should combine %s, %s and %s filters', async (aType, bType) => {
        const a = vi.fn().mockReturnValue(aType === 'sync' ? false : Promise.resolve(false))
        const b = vi.fn().mockReturnValue(bType === 'sync' ? false : Promise.resolve(false))
        const c = vi.fn().mockReturnValue(bType === 'sync' ? false : Promise.resolve(false))

        const combined = or(a, b, c)

        expect(await combined(1)).toBe(false)
        expect(a).toHaveBeenCalledTimes(1)
        expect(a).toHaveBeenCalledWith(1, undefined)
        expect(b).toHaveBeenCalledTimes(1)
        expect(b).toHaveBeenCalledWith(1, undefined)
        expect(c).toHaveBeenCalledTimes(1)
        expect(c).toHaveBeenCalledWith(1, undefined)
    })

    it.each([
        ['sync', 'sync', 'sync'],
        ['sync', 'sync', 'async'],
        ['sync', 'async', 'sync'],
        ['sync', 'async', 'async'],
        ['async', 'sync', 'sync'],
        ['async', 'sync', 'async'],
        ['async', 'async', 'sync'],
        ['async', 'async', 'async'],
    ])('should not continue execution after true (%s, %s and %s filters)', async (aType, bType) => {
        const a = vi.fn().mockReturnValue(aType === 'sync' ? false : Promise.resolve(false))
        const b = vi.fn().mockReturnValue(bType === 'sync' ? true : Promise.resolve(true))
        const c = vi.fn().mockReturnValue(bType === 'sync' ? false : Promise.resolve(false))

        const combined = or(a, b, c)

        expect(await combined(1)).toBe(true)
        expect(a).toHaveBeenCalledTimes(1)
        expect(a).toHaveBeenCalledWith(1, undefined)
        expect(b).toHaveBeenCalledTimes(1)
        expect(b).toHaveBeenCalledWith(1, undefined)
        expect(c).not.toHaveBeenCalled()
    })
})
