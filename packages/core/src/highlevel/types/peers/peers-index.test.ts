import { describe, expect, it } from 'vitest'

import { createStub } from '@mtcute/test'

import { MtArgumentError } from '../../../types/errors.js'
import { PeersIndex } from './peers-index.js'

describe('PeersIndex', () => {
    it('should build the index from an object with users/chats fields', () => {
        const obj = {
            users: [createStub('user', { id: 1 }), createStub('user', { id: 2 })],
            chats: [createStub('chat', { id: 1 }), createStub('channel', { id: 2 })],
        }

        const peers = PeersIndex.from(obj)

        expect(peers.users.size).toBe(2)
        expect(peers.chats.size).toBe(2)
        expect(peers.users.get(1)).toBe(obj.users[0])
        expect(peers.users.get(2)).toBe(obj.users[1])
        expect(peers.chats.get(1)).toBe(obj.chats[0])
        expect(peers.chats.get(2)).toBe(obj.chats[1])
    })

    it('should detect min peers and set hasMin', () => {
        const obj = {
            users: [createStub('user', { id: 1 }), createStub('user', { id: 2, min: true })],
            chats: [createStub('chat', { id: 1 }), createStub('channel', { id: 2, min: true })],
        }

        const peers = PeersIndex.from(obj)

        expect(peers.hasMin).toBe(true)
    })

    describe('#user', () => {
        it('should find user info by its id', () => {
            const peers = PeersIndex.from({
                users: [createStub('user', { id: 1 }), createStub('user', { id: 2 })],
            })

            expect(peers.user(1)).toBe(peers.users.get(1))
            expect(peers.user(2)).toBe(peers.users.get(2))
        })

        it('should throw if user is not found', () => {
            const peers = PeersIndex.from({
                users: [createStub('user', { id: 1 }), createStub('user', { id: 2 })],
            })

            expect(() => peers.user(3)).toThrow(MtArgumentError)
        })
    })

    describe('#chat', () => {
        it('should find chat info by its id', () => {
            const peers = PeersIndex.from({
                chats: [createStub('chat', { id: 1 }), createStub('channel', { id: 2 })],
            })

            expect(peers.chat(1)).toBe(peers.chats.get(1))
            expect(peers.chat(2)).toBe(peers.chats.get(2))
        })

        it('should throw if chat is not found', () => {
            const peers = PeersIndex.from({
                chats: [createStub('chat', { id: 1 }), createStub('channel', { id: 2 })],
            })

            expect(() => peers.chat(3)).toThrow(MtArgumentError)
        })
    })

    describe('#get', () => {
        it('should find peer info by Peer', () => {
            const peers = PeersIndex.from({
                users: [createStub('user', { id: 1 }), createStub('user', { id: 2 })],
                chats: [createStub('chat', { id: 1 }), createStub('channel', { id: 2 })],
            })

            expect(peers.get({ _: 'peerUser', userId: 1 })).toBe(peers.users.get(1))
            expect(peers.get({ _: 'peerChat', chatId: 1 })).toBe(peers.chats.get(1))
            expect(peers.get({ _: 'peerChannel', channelId: 2 })).toBe(peers.chats.get(2))
        })
    })
})
