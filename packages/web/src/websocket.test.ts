import { describe, expect, it, Mock, MockedObject, vi } from 'vitest'

import { TransportState } from '@mtcute/core'
import { getPlatform } from '@mtcute/core/platform.js'
import { defaultProductionDc, LogManager } from '@mtcute/core/utils.js'
import { defaultTestCryptoProvider, u8HexDecode } from '@mtcute/test'

import { WebSocketTransport } from './websocket.js'

const p = getPlatform()

describe('WebSocketTransport', () => {
    const create = async () => {
        const fakeWs = vi.fn().mockImplementation(() => ({
            addEventListener: vi.fn().mockImplementation((event: string, cb: () => void) => {
                if (event === 'open') {
                    cb()
                }
            }),
            removeEventListener: vi.fn(),
            close: vi.fn(),
            send: vi.fn(),
        }))

        const transport = new WebSocketTransport({ ws: fakeWs })
        const logger = new LogManager()
        logger.level = 0
        transport.setup(await defaultTestCryptoProvider(), logger)

        return [transport, fakeWs] as const
    }

    const getLastSocket = (ws: Mock) => {
        return ws.mock.results[ws.mock.results.length - 1].value as MockedObject<WebSocket>
    }

    it('should initiate a websocket connection to the given dc', async () => {
        const [t, ws] = await create()

        t.connect(defaultProductionDc.main, false)

        expect(ws).toHaveBeenCalledOnce()
        expect(ws).toHaveBeenCalledWith('wss://venus.web.telegram.org/apiws', 'binary')
        await vi.waitFor(() => expect(t.state()).toEqual(TransportState.Ready))
    })

    it('should set up event handlers', async () => {
        const [t, ws] = await create()

        t.connect(defaultProductionDc.main, false)
        const socket = getLastSocket(ws)

        expect(socket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
        expect(socket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
        expect(socket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function))
    })

    it('should write packet codec tag to the socket', async () => {
        const [t, ws] = await create()

        t.connect(defaultProductionDc.main, false)
        const socket = getLastSocket(ws)

        await vi.waitFor(() =>
            expect(socket.send).toHaveBeenCalledWith(
                u8HexDecode(
                    '29afd26df40fb8ed10b6b4ad6d56ef5df9453f88e6ee6adb6e0544ba635dc6a8a990c9b8b980c343936b33fa7f97bae025102532233abb26d4a1fe6d34f1ba08',
                ),
            ),
        )
    })

    it('should write to the underlying socket', async () => {
        const [t, ws] = await create()

        t.connect(defaultProductionDc.main, false)
        const socket = getLastSocket(ws)
        await vi.waitFor(() => expect(t.state()).toEqual(TransportState.Ready))

        await t.send(p.hexDecode('00010203040506070809'))

        expect(socket.send).toHaveBeenCalledWith(p.hexDecode('af020630c8ef14bcf53af33853ea'))
    })

    it('should correctly close', async () => {
        const [t, ws] = await create()

        t.connect(defaultProductionDc.main, false)
        const socket = getLastSocket(ws)
        await vi.waitFor(() => expect(t.state()).toEqual(TransportState.Ready))

        t.close()

        expect(socket.removeEventListener).toHaveBeenCalled()
        expect(socket.close).toHaveBeenCalled()
    })

    it('should correctly handle incoming messages', async () => {
        const [t, ws] = await create()

        const feedSpy = vi.spyOn(t._packetCodec, 'feed')

        t.connect(defaultProductionDc.main, false)
        const socket = getLastSocket(ws)
        await vi.waitFor(() => expect(t.state()).toEqual(TransportState.Ready))

        const data = p.hexDecode('00010203040506070809')
        const message = new MessageEvent('message', { data })

        const onMessageCall = socket.addEventListener.mock.calls.find(([event]) => event === 'message') as unknown as [
            string,
            (evt: MessageEvent) => void,
        ]
        onMessageCall[1](message)

        expect(feedSpy).toHaveBeenCalledWith(u8HexDecode('00010203040506070809'))
    })

    it('should propagate errors', async () => {
        const [t, ws] = await create()

        const spyEmit = vi.spyOn(t, 'emit').mockImplementation(() => true)

        t.connect(defaultProductionDc.main, false)
        const socket = getLastSocket(ws)
        await vi.waitFor(() => expect(t.state()).toEqual(TransportState.Ready))

        const error = new Error('test')
        const onErrorCall = socket.addEventListener.mock.calls.find(([event]) => event === 'error') as unknown as [
            string,
            (evt: { error: Error }) => void,
        ]
        onErrorCall[1]({ error })

        expect(spyEmit).toHaveBeenCalledWith('error', error)
    })
})
