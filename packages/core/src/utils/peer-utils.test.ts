import Long from 'long'
import { describe, expect, it } from 'vitest'

import { createStub } from '@mtcute/test'

import {
    getAllPeersFrom,
    getBarePeerId,
    getMarkedPeerId,
    parseMarkedPeerId,
    toggleChannelIdMark,
} from './peer-utils.js'

const SOME_CHANNEL_ID = 1183945448
const SOME_CHANNEL_ID_MARKED = -1001183945448

describe('toggleChannelIdMark', () => {
    it('should turn marked channel id into bare', () => {
        expect(toggleChannelIdMark(SOME_CHANNEL_ID_MARKED)).toEqual(SOME_CHANNEL_ID)
    })

    it('should turn bare channel id into marked', () => {
        expect(toggleChannelIdMark(SOME_CHANNEL_ID)).toEqual(SOME_CHANNEL_ID_MARKED)
    })
})

describe('getBarePeerId', () => {
    it('should return bare peer id from Peer', () => {
        expect(getBarePeerId({ _: 'peerUser', userId: 123 })).toEqual(123)
        expect(getBarePeerId({ _: 'peerChat', chatId: 456 })).toEqual(456)
        expect(getBarePeerId({ _: 'peerChannel', channelId: 789 })).toEqual(789)
    })
})

describe('getMarkedPeerId', () => {
    it('should return marked peer id from bare and type', () => {
        expect(getMarkedPeerId(123, 'user')).toEqual(123)
        expect(getMarkedPeerId(456, 'chat')).toEqual(-456)
        expect(getMarkedPeerId(SOME_CHANNEL_ID, 'channel')).toEqual(SOME_CHANNEL_ID_MARKED)
    })

    it('should throw on invalid type', () => {
        // eslint-disable-next-line
        expect(() => getMarkedPeerId(123, 'invalid' as any)).toThrow()
    })

    it('should return marked peer id from Peer', () => {
        expect(getMarkedPeerId({ _: 'peerUser', userId: 123 })).toEqual(123)
        expect(getMarkedPeerId({ _: 'peerChat', chatId: 456 })).toEqual(-456)
        expect(getMarkedPeerId({ _: 'peerChannel', channelId: SOME_CHANNEL_ID })).toEqual(SOME_CHANNEL_ID_MARKED)
    })

    it('should return marked peer id from Input*', () => {
        expect(getMarkedPeerId({ _: 'inputPeerUser', userId: 123, accessHash: Long.ZERO })).toEqual(123)
        expect(getMarkedPeerId({ _: 'inputUser', userId: 123, accessHash: Long.ZERO })).toEqual(123)
        expect(getMarkedPeerId({ _: 'inputPeerChat', chatId: 456 })).toEqual(-456)
        expect(getMarkedPeerId({ _: 'inputPeerChannel', channelId: SOME_CHANNEL_ID, accessHash: Long.ZERO })).toEqual(
            SOME_CHANNEL_ID_MARKED,
        )
        expect(getMarkedPeerId({ _: 'inputChannel', channelId: SOME_CHANNEL_ID, accessHash: Long.ZERO })).toEqual(
            SOME_CHANNEL_ID_MARKED,
        )
    })

    it('should throw if peer does not have id', () => {
        expect(() => getMarkedPeerId({ _: 'inputPeerSelf' })).toThrow()
    })
})

describe('parseMarkedPeerId', () => {
    it('should correctly parse marked ids', () => {
        expect(parseMarkedPeerId(123)).toEqual(['user', 123])
        expect(parseMarkedPeerId(-456)).toEqual(['chat', 456])
        expect(parseMarkedPeerId(SOME_CHANNEL_ID_MARKED)).toEqual(['channel', SOME_CHANNEL_ID])
    })

    it('should throw for invalid marked ids', () => {
        expect(() => parseMarkedPeerId(0)).toThrow('Invalid marked peer id')

        // secret chats are not supported yet
        expect(() => parseMarkedPeerId(-1997852516400)).toThrow('Secret chats are not supported')
    })
})

describe('getAllPeersFrom', () => {
    const stubUser1 = createStub('user', { id: 123 })
    const stubUser2 = createStub('user', { id: 456 })
    const stubChat = createStub('chat', { id: 789 })
    const stubChannel = createStub('channel', { id: 101112 })

    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    it('should find all peers from objects containing users/chats fields', () => {
        expect([...getAllPeersFrom({ users: [], chats: [] } as any)]).toEqual([])
        expect([
            ...getAllPeersFrom({
                users: [stubUser1, stubUser2],
                chats: [stubChat, stubChannel],
            } as any),
        ]).toEqual([stubUser1, stubUser2, stubChat, stubChannel])
    })

    it('should extract peers from objects containing user/chat fields', () => {
        expect([
            ...getAllPeersFrom({
                user: stubUser2,
                chat: stubChat,
                channel: stubChannel,
            } as any),
        ]).toEqual([stubUser2, stubChat, stubChannel])
    })

    it('should work for arrays', () => {
        expect([...getAllPeersFrom([{ user: stubUser1 }, { user: stubUser2 }] as any)]).toEqual([stubUser1, stubUser2])
    })

    it('should work for peer objects directly', () => {
        expect([...getAllPeersFrom(stubUser1)]).toEqual([stubUser1])
    })

    it('should ignore *Empty', () => {
        expect([
            ...getAllPeersFrom({
                users: [createStub('userEmpty')],
                chats: [createStub('chatEmpty')],
            } as any),
        ]).toEqual([])
        expect([...getAllPeersFrom({ user: createStub('userEmpty'), chat: createStub('chatEmpty') } as any)]).toEqual(
            [],
        )
        expect([...getAllPeersFrom([createStub('userEmpty'), createStub('chatEmpty')])]).toEqual([])
    })

    it('should correctly handle users/chats fields of type number[]', () => {
        expect([...getAllPeersFrom({ users: [123, 456], chats: [123, 456] } as any)]).toEqual([])
    })

    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
})
