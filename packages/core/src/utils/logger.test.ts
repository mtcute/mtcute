import Long from 'long'
import { describe, expect, it, vi } from 'vitest'

import { LogManager } from './logger.js'

describe('logger', () => {
    const createManager = () => {
        const mgr = new LogManager()

        const spy = vi.fn<Parameters<typeof mgr.handler>>()
        mgr.handler = spy

        return [mgr, spy] as const
    }

    it('should only log messages below the set level', () => {
        const [mgr, spy] = createManager()

        mgr.level = LogManager.INFO
        mgr.error('test error')
        mgr.warn('test warn')
        mgr.info('test info')
        mgr.debug('test debug')
        mgr.verbose('test verbose')

        expect(spy).toHaveBeenCalledTimes(3)
        expect(spy).toHaveBeenCalledWith(3, 1, 'base', 'test error', [])
        expect(spy).toHaveBeenCalledWith(3, 2, 'base', 'test warn', [])
        expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test info', [])
    })

    it('should create child loggers', () => {
        const [mgr, spy] = createManager()

        mgr.create('child').info('test info')

        expect(spy).toHaveBeenCalledWith(0, 3, 'child', 'test info', [])
    })

    it('should apply filtering by tags', () => {
        const [mgr, spy] = createManager()

        const test1 = mgr.create('test1')
        const test2 = mgr.create('test2')

        mgr.filter((tag) => tag === 'test1')

        test1.info('test1 info')
        test2.info('test2 info')

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(5, 3, 'test1', 'test1 info', [])
    })

    it('should recursively add prefixes', () => {
        const [mgr, spy] = createManager()

        const test = mgr.create('test1')
        const test2 = test.create('test2')

        test.prefix = '[TEST] '
        test2.prefix = '[TEST2] '

        test2.create('test3').info('test info')

        expect(spy).toHaveBeenCalledWith(1, 3, 'test3', '[TEST] [TEST2] test info', [])
    })

    describe('formatting', () => {
        it('should pass generic format strings through', () => {
            const [mgr, spy] = createManager()

            mgr.info('test %s', 'info')

            expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test %s', ['info'])
        })

        describe('%h', () => {
            it('should format buffers as hex strings', () => {
                const [mgr, spy] = createManager()

                mgr.info('test %h', new Uint8Array([0x01, 0x02, 0x03]))

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test 010203', [])
            })

            it('should format numbers as hex', () => {
                const [mgr, spy] = createManager()

                mgr.info('test %h', 0x010203)
                mgr.info('test bigint %h', 0x010203n)

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test 10203', [])
                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test bigint 10203', [])
            })

            it('should format everything else as normal strings', () => {
                const [mgr, spy] = createManager()

                mgr.info('test %h', {})

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test [object Object]', [])
            })
        })

        describe('%b', () => {
            it('should format booleans as strings', () => {
                const [mgr, spy] = createManager()

                mgr.info('test %b', true)

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test true', [])
            })

            it('should coerce everything to boolean', () => {
                const [mgr, spy] = createManager()

                mgr.info('test %b', 123)

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test true', [])
            })
        })

        describe('%j', () => {
            it('should format objects as JSON', () => {
                const [mgr, spy] = createManager()

                mgr.info('test %j', { a: 1 })

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test {"a":1}', [])
            })

            if (import.meta.env.TEST_ENV === 'node' || import.meta.env.TEST_ENV === 'bun') {
                it('should format Buffers inside as hex strings', () => {
                    const [mgr, spy] = createManager()

                    // eslint-disable-next-line no-restricted-globals
                    mgr.info('test %j', { a: Buffer.from([1, 2, 3]) })
                    mgr.info('test Uint8Array %j', { a: new Uint8Array([1, 2, 3]) })

                    expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test {"a":"010203"}', [])
                    expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test Uint8Array {"a":"010203"}', [])
                })
            }

            it('should trim long buffers', () => {
                const [mgr, spy] = createManager()

                const _150hexZeros = Array(150).fill('00').join('')

                mgr.info('test %j', { a: new Uint8Array(300) })

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', `test {"a":"${_150hexZeros}..."}`, [])
            })

            it('should have %J variation accepting iterators', () => {
                const [mgr, spy] = createManager()

                mgr.info('test %J', new Set([1, 2, 3]))

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test [1,2,3]', [])
            })
        })

        describe('%l', () => {
            it('should format Longs as strings', () => {
                const [mgr, spy] = createManager()

                mgr.info('test %l', Long.fromInt(123))

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test 123', [])
            })
        })

        describe('%L', () => {
            it('should format Long arrays as strings', () => {
                const [mgr, spy] = createManager()

                mgr.info('test %L', [Long.fromInt(123), Long.fromInt(456)])

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test [123, 456]', [])
            })

            it('should format everything else as n/a', () => {
                const [mgr, spy] = createManager()

                mgr.info('test %L', 123)

                expect(spy).toHaveBeenCalledWith(3, 3, 'base', 'test n/a', [])
            })
        })
    })
})
