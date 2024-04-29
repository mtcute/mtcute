import type { Socket } from 'net'
import { describe, expect, it, MockedObject, vi } from 'vitest'

import { TransportState } from '@mtcute/core'
import { getPlatform } from '@mtcute/core/platform.js'
import { defaultProductionDc, LogManager } from '@mtcute/core/utils.js'

if (import.meta.env.TEST_ENV === 'node') {
    vi.doMock('net', () => ({
        connect: vi.fn().mockImplementation((port: number, ip: string, cb: () => void) => {
            cb()

            return {
                on: vi.fn(),
                write: vi.fn().mockImplementation((data: Uint8Array, cb: () => void) => {
                    cb()
                }),
                end: vi.fn(),
                removeAllListeners: vi.fn(),
                destroy: vi.fn(),
            }
        }),
    }))

    const net = await import('net')
    const connect = vi.mocked(net.connect)

    const { TcpTransport } = await import('./tcp.js')
    const { defaultTestCryptoProvider, u8HexDecode } = await import('@mtcute/test')

    describe('TcpTransport', () => {
        const getLastSocket = () => {
            return connect.mock.results[connect.mock.results.length - 1].value as MockedObject<Socket>
        }

        const create = async () => {
            const transport = new TcpTransport()
            const logger = new LogManager()
            logger.level = 0
            transport.setup(await defaultTestCryptoProvider(), logger)

            return transport
        }

        it('should initiate a tcp connection to the given dc', async () => {
            const t = await create()

            t.connect(defaultProductionDc.main, false)

            expect(connect).toHaveBeenCalledOnce()
            expect(connect).toHaveBeenCalledWith(
                defaultProductionDc.main.port,
                defaultProductionDc.main.ipAddress,
                expect.any(Function),
            )
            await vi.waitFor(() => expect(t.state()).toEqual(TransportState.Ready))
        })

        it('should set up event handlers', async () => {
            const t = await create()

            t.connect(defaultProductionDc.main, false)

            const socket = getLastSocket()

            expect(socket.on).toHaveBeenCalledTimes(3)
            expect(socket.on).toHaveBeenCalledWith('data', expect.any(Function))
            expect(socket.on).toHaveBeenCalledWith('error', expect.any(Function))
            expect(socket.on).toHaveBeenCalledWith('close', expect.any(Function))
        })

        it('should write packet codec tag once connected', async () => {
            const t = await create()

            t.connect(defaultProductionDc.main, false)

            const socket = getLastSocket()

            await vi.waitFor(() =>
                expect(socket.write).toHaveBeenCalledWith(
                    u8HexDecode('eeeeeeee'), // intermediate
                    expect.any(Function),
                ),
            )
        })

        it('should write to the underlying socket', async () => {
            const t = await create()

            t.connect(defaultProductionDc.main, false)
            await vi.waitFor(() => expect(t.state()).toEqual(TransportState.Ready))

            await t.send(getPlatform().hexDecode('00010203040506070809'))

            const socket = getLastSocket()

            expect(socket.write).toHaveBeenCalledWith(u8HexDecode('0a00000000010203040506070809'), expect.any(Function))
        })

        it('should correctly close', async () => {
            const t = await create()

            t.connect(defaultProductionDc.main, false)
            await vi.waitFor(() => expect(t.state()).toEqual(TransportState.Ready))

            t.close()

            const socket = getLastSocket()

            expect(socket.removeAllListeners).toHaveBeenCalledOnce()
            expect(socket.destroy).toHaveBeenCalledOnce()
        })

        it('should feed data to the packet codec', async () => {
            const t = await create()
            const codec = t._packetCodec

            const spyFeed = vi.spyOn(codec, 'feed')

            t.connect(defaultProductionDc.main, false)
            await vi.waitFor(() => expect(t.state()).toEqual(TransportState.Ready))

            const socket = getLastSocket()

            const onDataCall = socket.on.mock.calls.find((c) => (c as string[])[0] === 'data') as unknown as [
                string,
                (data: Uint8Array) => void,
            ]
            onDataCall[1](u8HexDecode('00010203040506070809'))

            expect(spyFeed).toHaveBeenCalledWith(u8HexDecode('00010203040506070809'))
        })

        it('should propagate errors', async () => {
            const t = await create()

            const spyEmit = vi.fn()
            t.on('error', spyEmit)

            t.connect(defaultProductionDc.main, false)
            await vi.waitFor(() => expect(t.state()).toEqual(TransportState.Ready))

            const socket = getLastSocket()

            const onErrorCall = socket.on.mock.calls.find((c) => (c as string[])[0] === 'error') as unknown as [
                string,
                (error: Error) => void,
            ]
            onErrorCall[1](new Error('test error'))

            expect(spyEmit).toHaveBeenCalledWith(new Error('test error'))
        })
    })
} else {
    describe.skip('TcpTransport', () => {})
}
