import { describe, expect, it } from 'vitest'

import { createStub } from '@mtcute/test'

import { MtInvalidPeerTypeError } from '../types/index.js'
import {
    inputPeerToPeer,
    isInputPeerChannel,
    isInputPeerChat,
    isInputPeerUser,
    toInputChannel,
    toInputPeer,
    toInputUser,
} from './peer-utils.js'

describe('toInputPeer', () => {
    it.each([
        ['inputChannelEmpty', 'inputPeerEmpty'],
        ['inputUserEmpty', 'inputPeerEmpty'],
        ['inputUser', 'inputPeerUser'],
        ['inputUserSelf', 'inputPeerSelf'],
        ['inputUserSelf', 'inputPeerSelf'],
        ['inputChannel', 'inputPeerChannel'],
        ['inputChannelFromMessage', 'inputPeerChannelFromMessage'],
        ['inputUserFromMessage', 'inputPeerUserFromMessage'],
    ] as const)('should convert %s to %s', (fromType, toType) => {
        const from = createStub(fromType)
        const to = createStub(toType)

        expect(toInputPeer(from)).toEqual(to)
    })

    it.each([
        ['inputPeerEmpty'],
        ['inputPeerSelf'],
        ['inputPeerUser'],
        ['inputPeerChannel'],
        ['inputPeerChannelFromMessage'],
        ['inputPeerUserFromMessage'],
    ] as const)('should keep %s as is', (type) => {
        const obj = createStub(type)

        expect(toInputPeer(obj)).toBe(obj)
    })
})

describe('toInputUser', () => {
    it.each([
        ['inputPeerSelf', 'inputUserSelf'],
        ['inputPeerUser', 'inputUser'],
        ['inputPeerUserFromMessage', 'inputUserFromMessage'],
    ] as const)('should convert %s to %s', (fromType, toType) => {
        const from = createStub(fromType)
        const to = createStub(toType)

        expect(toInputUser(from)).toEqual(to)
    })

    it('should throw for other types', () => {
        expect(() => toInputUser(createStub('inputPeerChannel'), 'some_channel')).toThrow(MtInvalidPeerTypeError)
    })
})

describe('toInputChannel', () => {
    it.each([
        ['inputPeerChannel', 'inputChannel'],
        ['inputPeerChannelFromMessage', 'inputChannelFromMessage'],
    ] as const)('should convert %s to %s', (fromType, toType) => {
        const from = createStub(fromType)
        const to = createStub(toType)

        expect(toInputChannel(from)).toEqual(to)
    })

    it('should throw for other types', () => {
        expect(() => toInputChannel(createStub('inputPeerUser'), 'some_user')).toThrow(MtInvalidPeerTypeError)
    })
})

describe('isInputPeerUser', () => {
    it.each([['inputPeerSelf'], ['inputPeerUser'], ['inputPeerUserFromMessage']] as const)(
        'should return true for %s',
        (type) => {
            expect(isInputPeerUser(createStub(type))).toBe(true)
        },
    )

    it.each([['inputPeerEmpty'], ['inputPeerChannel'], ['inputPeerChannelFromMessage']] as const)(
        'should return false for %s',
        (type) => {
            expect(isInputPeerUser(createStub(type))).toBe(false)
        },
    )
})

describe('isInputPeerChannel', () => {
    it.each([['inputPeerChannel'], ['inputPeerChannelFromMessage']] as const)('should return true for %s', (type) => {
        expect(isInputPeerChannel(createStub(type))).toBe(true)
    })

    it.each([['inputPeerEmpty'], ['inputPeerSelf'], ['inputPeerUser'], ['inputPeerUserFromMessage']] as const)(
        'should return false for %s',
        (type) => {
            expect(isInputPeerChannel(createStub(type))).toBe(false)
        },
    )
})

describe('isInputPeerChat', () => {
    it('should return true for inputPeerChat', () => {
        expect(isInputPeerChat(createStub('inputPeerChat'))).toBe(true)
    })

    it.each([
        ['inputPeerChannel'],
        ['inputPeerChannelFromMessage'],
        ['inputPeerEmpty'],
        ['inputPeerSelf'],
        ['inputPeerUser'],
        ['inputPeerUserFromMessage'],
    ] as const)('should return false for %s', (type) => {
        expect(isInputPeerChat(createStub(type))).toBe(false)
    })
})

describe('inputPeerToPeer', () => {
    it.each([
        ['inputPeerUser', 'peerUser'],
        ['inputPeerUserFromMessage', 'peerUser'],
        ['inputPeerChat', 'peerChat'],
        ['inputPeerChannel', 'peerChannel'],
        ['inputPeerChannelFromMessage', 'peerChannel'],
    ] as const)('should convert %s to %s', (fromType, toType) => {
        const from = createStub(fromType)
        const to = createStub(toType)

        expect(inputPeerToPeer(from)).toEqual(to)
    })

    it('should throw for other types', () => {
        expect(() => inputPeerToPeer(createStub('inputPeerEmpty'))).toThrow(MtInvalidPeerTypeError)
        expect(() => inputPeerToPeer(createStub('inputPeerSelf'))).toThrow(MtInvalidPeerTypeError)
    })
})
