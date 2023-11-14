import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createStub, defaultTestCryptoProvider, StubTelegramTransport } from '@mtcute/test'

import { LogManager } from '../utils/index.js'
import { PersistentConnection, PersistentConnectionParams } from './persistent-connection.js'
import { defaultReconnectionStrategy } from './reconnection.js'

class FakePersistentConnection extends PersistentConnection {
    constructor(params: PersistentConnectionParams) {
        const log = new LogManager()
        log.level = 0
        super(params, log)
    }

    onConnected() {
        this.onConnectionUsable()
    }
    onError() {}
    onMessage() {}
}

describe('PersistentConnection', () => {
    beforeEach(() => void vi.useFakeTimers())
    afterEach(() => void vi.useRealTimers())

    const create = async (params?: Partial<PersistentConnectionParams>) => {
        return new FakePersistentConnection({
            crypto: await defaultTestCryptoProvider(),
            transportFactory: () => new StubTelegramTransport({}),
            dc: createStub('dcOption'),
            testMode: false,
            reconnectionStrategy: defaultReconnectionStrategy,
            ...params,
        })
    }

    it('should set up listeners on transport', async () => {
        const transportFactory = vi.fn().mockImplementation(() => {
            const transport = new StubTelegramTransport({})

            vi.spyOn(transport, 'on')

            return transport
        })
        await create({ transportFactory })

        const transport = transportFactory.mock.results[0].value as StubTelegramTransport

        expect(transport.on).toHaveBeenCalledWith('ready', expect.any(Function))
        expect(transport.on).toHaveBeenCalledWith('message', expect.any(Function))
        expect(transport.on).toHaveBeenCalledWith('error', expect.any(Function))
        expect(transport.on).toHaveBeenCalledWith('close', expect.any(Function))
    })

    it('should properly reset old transport', async () => {
        const transportFactory = vi.fn().mockImplementation(() => {
            const transport = new StubTelegramTransport({})

            vi.spyOn(transport, 'close')

            return transport
        })
        const pc = await create({ transportFactory })

        const transport = transportFactory.mock.results[0].value as StubTelegramTransport

        pc.changeTransport(transportFactory)

        expect(transport.close).toHaveBeenCalledOnce()
    })

    it('should buffer unsent packages', async () => {
        const transportFactory = vi.fn().mockImplementation(() => {
            const transport = new StubTelegramTransport({})

            const transportConnect = transport.connect
            vi.spyOn(transport, 'connect').mockImplementation((dc, test) => {
                setTimeout(() => {
                    transportConnect.call(transport, dc, test)
                }, 100)
            })
            vi.spyOn(transport, 'send')

            return transport
        })
        const pc = await create({ transportFactory })

        const transport = transportFactory.mock.results[0].value as StubTelegramTransport

        const data1 = new Uint8Array([1, 2, 3])
        const data2 = new Uint8Array([4, 5, 6])

        await pc.send(data1)
        await pc.send(data2)

        expect(transport.send).toHaveBeenCalledTimes(0)

        await vi.advanceTimersByTimeAsync(150)

        expect(transport.send).toHaveBeenCalledTimes(2)
        expect(transport.send).toHaveBeenCalledWith(data1)
        expect(transport.send).toHaveBeenCalledWith(data2)
    })

    it('should reconnect on close', async () => {
        const reconnectionStrategy = vi.fn().mockImplementation(() => 1000)
        const transportFactory = vi.fn().mockImplementation(() => new StubTelegramTransport({}))

        const pc = await create({
            reconnectionStrategy,
            transportFactory,
        })

        const transport = transportFactory.mock.results[0].value as StubTelegramTransport

        pc.connect()

        await vi.waitFor(() => expect(pc.isConnected).toBe(true))

        transport.close()

        expect(reconnectionStrategy).toHaveBeenCalledOnce()
        expect(pc.isConnected).toBe(false)

        await vi.advanceTimersByTimeAsync(1000)

        expect(pc.isConnected).toBe(true)
    })

    describe('inactivity timeout', () => {
        it('should disconnect on inactivity (passed in constructor)', async () => {
            const pc = await create({
                inactivityTimeout: 1000,
            })

            pc.connect()

            await vi.waitFor(() => expect(pc.isConnected).toBe(true))

            vi.advanceTimersByTime(1000)

            await vi.waitFor(() => expect(pc.isConnected).toBe(false))
        })

        it('should disconnect on inactivity (set up with setInactivityTimeout)', async () => {
            const pc = await create()

            pc.connect()
            pc.setInactivityTimeout(1000)

            await vi.waitFor(() => expect(pc.isConnected).toBe(true))

            vi.advanceTimersByTime(1000)

            await vi.waitFor(() => expect(pc.isConnected).toBe(false))
        })

        it('should not disconnect on inactivity if disabled', async () => {
            const pc = await create({
                inactivityTimeout: 1000,
            })

            pc.connect()
            pc.setInactivityTimeout(undefined)

            await vi.waitFor(() => expect(pc.isConnected).toBe(true))

            vi.advanceTimersByTime(1000)

            await vi.waitFor(() => expect(pc.isConnected).toBe(true))
        })

        it('should reconnect after inactivity before sending', async () => {
            const transportFactory = vi.fn().mockImplementation(() => {
                const transport = new StubTelegramTransport({})

                vi.spyOn(transport, 'connect')
                vi.spyOn(transport, 'send')

                return transport
            })

            const pc = await create({
                inactivityTimeout: 1000,
                transportFactory,
            })
            const transport = transportFactory.mock.results[0].value as StubTelegramTransport

            pc.connect()

            vi.advanceTimersByTime(1000)

            await vi.waitFor(() => expect(pc.isConnected).toBe(false))

            vi.mocked(transport.connect).mockClear()

            await pc.send(new Uint8Array([1, 2, 3]))

            expect(transport.connect).toHaveBeenCalledOnce()
            expect(transport.send).toHaveBeenCalledOnce()
        })

        it('should propagate errors', async () => {
            const transportFactory = vi.fn().mockImplementation(() => new StubTelegramTransport({}))

            const pc = await create({ transportFactory })
            const transport = transportFactory.mock.results[0].value as StubTelegramTransport

            pc.connect()

            await vi.waitFor(() => expect(pc.isConnected).toBe(true))

            const onErrorSpy = vi.spyOn(pc, 'onError')

            transport.emit('error', new Error('test error'))

            expect(onErrorSpy).toHaveBeenCalledOnce()
        })
    })
})
