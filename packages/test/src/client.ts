import {
    BaseTelegramClient,
    BaseTelegramClientOptions,
    MaybePromise,
    MustEqual,
    RpcCallOptions,
    tl,
} from '@mtcute/core'

import { defaultCryptoProvider } from './platform.js'
import { StubMemoryTelegramStorage } from './storage.js'
import { StubTelegramTransport } from './transport.js'
import { InputResponder } from './types.js'
import { markedIdToPeer } from './utils.js'

interface MessageBox {
    pts: number
    lastMessageId: number
}

type InputPeerId = number | tl.TypePeer | false | undefined

export class StubTelegramClient extends BaseTelegramClient {
    constructor(params?: Partial<BaseTelegramClientOptions>) {
        const storage = new StubMemoryTelegramStorage({
            hasKeys: true,
            hasTempKeys: true,
        })

        super({
            apiId: 0,
            apiHash: '',
            logLevel: 0,
            storage,
            disableUpdates: true,
            transport: () => {
                const transport = new StubTelegramTransport({
                    onMessage: (data) => {
                        if (!this._onRawMessage) {
                            if (this._responders.size) {
                                this.emitError(new Error('Unexpected outgoing message'))
                            }

                            return
                        }

                        const dcId = transport._currentDc!.id
                        const key = storage.authKeys.get(dcId)

                        if (key) {
                            this._onRawMessage(storage.decryptOutgoingMessage(transport._crypto, data, dcId))
                        }
                    },
                })

                return transport
            },
            crypto: defaultCryptoProvider,
            ...params,
        })
    }

    /**
     * Create a fake client that may not actually be used for API calls
     *
     * Useful for testing "offline" methods
     */
    static offline() {
        const client = new StubTelegramClient()

        client.call = (obj) => {
            throw new Error(`Expected offline client to not make any API calls (method called: ${obj._})`)
        }

        return client
    }

    /**
     * Create a fake "full" client (i.e. TelegramClient)
     *
     * Basically a proxy that returns an empty function for every unknown method
     */
    static full() {
        const client = new StubTelegramClient()

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return new Proxy(client, {
            get(target, prop) {
                if (typeof prop === 'string' && !(prop in target)) {
                    return () => {}
                }

                return target[prop as keyof typeof target]
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any
        // i don't want to type this properly since it would require depending test utils on client
    }

    // some fake peers handling //

    readonly _knownChats = new Map<number, tl.TypeChat>()
    readonly _knownUsers = new Map<number, tl.TypeUser>()
    _selfId = 0

    async registerPeers(...peers: (tl.TypeUser | tl.TypeChat)[]): Promise<void> {
        for (const peer of peers) {
            if (tl.isAnyUser(peer)) {
                this._knownUsers.set(peer.id, peer)
            } else {
                this._knownChats.set(peer.id, peer)
            }

            await this.storage.peers.updatePeersFrom(peer)
        }
    }

    getPeers(ids: InputPeerId[]) {
        const users: tl.TypeUser[] = []
        const chats: tl.TypeChat[] = []

        for (let id of ids) {
            if (!id) continue

            if (typeof id === 'number') {
                id = markedIdToPeer(id)
            }

            switch (id._) {
                case 'peerUser': {
                    const user = this._knownUsers.get(id.userId)
                    if (!user) throw new Error(`Unknown user with ID ${id.userId}`)

                    users.push(user)
                    break
                }
                case 'peerChat': {
                    const chat = this._knownChats.get(id.chatId)
                    if (!chat) throw new Error(`Unknown chat with ID ${id.chatId}`)

                    chats.push(chat)
                    break
                }
                case 'peerChannel': {
                    const chat = this._knownChats.get(id.channelId)
                    if (!chat) throw new Error(`Unknown channel with ID ${id.channelId}`)

                    chats.push(chat)
                    break
                }
            }
        }

        return { users, chats }
    }

    // method calls intercepting //

    private _onRawMessage?: (data: Uint8Array) => void
    onRawMessage(fn: (data: Uint8Array) => void): void {
        this._onRawMessage = fn
    }

    // eslint-disable-next-line func-call-spacing
    private _responders = new Map<string, (data: unknown) => unknown>()

    addResponder<T extends tl.RpcMethod['_']>(responders: InputResponder<T>): void {
        if (Array.isArray(responders)) {
            for (const responder of responders) {
                this.addResponder(responder as InputResponder<tl.RpcMethod['_']>)
            }

            return
        }

        if (typeof responders === 'function') {
            responders = responders(this)
        }

        const [method, responder] = responders
        this.respondWith(method, responder)
    }

    respondWith<
        T extends tl.RpcMethod['_'],
        Fn extends(data: tl.FindByName<tl.RpcMethod, T>) => MaybePromise<tl.RpcCallReturn[T]>,
    >(method: T, response: Fn): Fn {
        // eslint-disable-next-line
        this._responders.set(method, response as any)

        return response
    }

    async call<T extends tl.RpcMethod>(
        message: MustEqual<T, tl.RpcMethod>,
        params?: RpcCallOptions,
    ): Promise<tl.RpcCallReturn[T['_']]> {
        if (this._responders.has(message._)) {
            // eslint-disable-next-line
            return Promise.resolve(this._responders.get(message._)!(message)) as any
        }

        return super.call(message, params)
    }

    // some fake updates mechanism //

    private _fakeMessageBoxes = new Map<number, MessageBox>()
    private _lastQts = 0
    private _lastDate = Math.floor(Date.now() / 1000)
    private _lastSeq = 0

    getMessageBox(chatId = 0): MessageBox {
        const state = this._fakeMessageBoxes.get(chatId)

        if (!state) {
            const newState = { pts: 0, lastMessageId: 0 }
            this._fakeMessageBoxes.set(chatId, newState)

            return newState
        }

        return state
    }

    getNextMessageId(chatId = 0) {
        const state = this.getMessageBox(chatId)

        const nextId = state.lastMessageId + 1
        state.lastMessageId = nextId

        return nextId
    }

    getNextPts(chatId = 0, count = 1) {
        const state = this.getMessageBox(chatId)

        const nextPts = state.pts + count
        state.pts = nextPts

        return nextPts
    }

    getNextQts() {
        return this._lastQts++
    }

    getNextDate() {
        return (this._lastDate = Math.floor(Date.now() / 1000))
    }

    createStubUpdates(params: {
        updates: tl.TypeUpdate[]
        peers?: (number | tl.TypePeer)[]
        seq?: number
        seqCount?: number
    }): tl.TypeUpdates {
        const { peers, updates, seq = 0, seqCount = 1 } = params

        const { users, chats } = this.getPeers(peers ?? [])

        const seqStart = seq - seqCount + 1

        if (seq !== 0) {
            this._lastSeq = seq + seqCount
        }

        if (seqStart !== seq) {
            return {
                _: 'updatesCombined',
                updates,
                users,
                chats,
                date: this.getNextDate(),
                seq,
                seqStart,
            }
        }

        return {
            _: 'updates',
            updates,
            users,
            chats,
            date: this.getNextDate(),
            seq,
        }
    }

    // helpers //

    async with(fn: () => MaybePromise<void>): Promise<void> {
        await this.connect()

        let error: unknown

        this.onError((err) => {
            error = err
        })

        try {
            await fn()
        } catch (e) {
            error = e
        }

        await this.close()

        if (error) {
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw error
        }
    }
}
