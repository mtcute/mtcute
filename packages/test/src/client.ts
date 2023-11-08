import { BaseTelegramClient, BaseTelegramClientOptions, MaybeAsync, MustEqual, RpcCallOptions, tl } from '@mtcute/core'

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
            transport: () => {
                const transport = new StubTelegramTransport({
                    onMessage: (data) => {
                        if (!this._onRawMessage) {
                            if (this._responders.size) {
                                this._emitError(new Error('Unexpected outgoing message'))
                            }

                            return
                        }

                        const dcId = transport._currentDc!.id
                        const key = storage.getAuthKeyFor(dcId)

                        if (key) {
                            this._onRawMessage(storage.decryptOutgoingMessage(transport._crypto, data, dcId))
                        }
                    },
                })

                return transport
            },
            ...params,
        })
    }

    // some fake peers handling //

    readonly _knownChats = new Map<number, tl.TypeChat>()
    readonly _knownUsers = new Map<number, tl.TypeUser>()
    _selfId = 0

    registerChat(chat: tl.TypeChat | tl.TypeChat[]): void {
        if (Array.isArray(chat)) {
            for (const c of chat) {
                this.registerChat(c)
            }

            return
        }

        this._knownChats.set(chat.id, chat)
    }

    registerUser(user: tl.TypeUser | tl.TypeUser[]): void {
        if (Array.isArray(user)) {
            for (const u of user) {
                this.registerUser(u)
            }

            return
        }

        this._knownUsers.set(user.id, user)

        if (user._ === 'user' && user.self) {
            this._selfId = user.id
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

    respondWith<T extends tl.RpcMethod['_']>(
        method: T,
        response: tl.RpcCallReturn[T] | ((data: tl.FindByName<tl.RpcMethod, T>) => tl.RpcCallReturn[T]),
    ) {
        if (typeof response !== 'function') {
            const res = response
            response = () => res
        }

        // eslint-disable-next-line
        this._responders.set(method, response as any)
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

    async connectAndWait() {
        await this.connect()
        await new Promise((resolve) => this.once('usable', resolve))
    }

    async with(fn: () => MaybeAsync<void>): Promise<void> {
        await this.connectAndWait()

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
