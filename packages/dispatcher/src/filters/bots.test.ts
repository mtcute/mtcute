import { describe, expect, it } from 'vitest'

import { Message, PeersIndex, tl } from '@mtcute/core'
import { createStub, StubTelegramClient } from '@mtcute/test'

import { MessageContext } from '../index.js'
import { command, deeplink } from './bots.js'

const peers = new PeersIndex()
peers.users.set(1, createStub('user', { id: 1 }))
peers.chats.set(1, createStub('channel', { id: 1 }))
const createMessageContext = (partial: Partial<tl.RawMessage>) =>
    new MessageContext(
        StubTelegramClient.full(), // eslint-disable-line
        {},
        new Message(createStub('message', partial), peers, false),
    )

describe('filters.command', () => {
    const getParsedCommand = (text: string, ...params: Parameters<typeof command>) => {
        const ctx = createMessageContext({
            message: text,
        })
        void ctx.client.storage.self.store({
            isBot: true,
            isPremium: false,
            userId: 0,
            usernames: ['testbot'],
        })

        // eslint-disable-next-line
        if (command(...params)(ctx)) return (ctx as any).command

        return null
    }

    it('should only parse given commands', () => {
        expect(getParsedCommand('/start', 'start')).toEqual(['start'])
        expect(getParsedCommand('/start', 'stop')).toEqual(null)
        expect(getParsedCommand('/start', ['start', 'stop'])).toEqual(['start'])
    })

    it('should only parse commands to the current bot', () => {
        expect(getParsedCommand('/start@testbot', 'start')).toEqual(['start'])
        expect(getParsedCommand('/start@otherbot', 'start')).toEqual(null)
    })

    it('should parse command arguments', () => {
        expect(getParsedCommand('/start foo bar baz', 'start')).toEqual(['start', 'foo', 'bar', 'baz'])
        expect(getParsedCommand('/start@testbot foo bar baz', 'start')).toEqual(['start', 'foo', 'bar', 'baz'])
    })

    it('should parse quoted command arguments', () => {
        expect(getParsedCommand('/start foo "bar baz"', 'start')).toEqual(['start', 'foo', 'bar baz'])
        expect(getParsedCommand('/start foo "bar \\" baz"', 'start')).toEqual(['start', 'foo', 'bar " baz'])
        expect(getParsedCommand('/start foo "bar \\\\" baz"', 'start')).toEqual(['start', 'foo', 'bar \\" baz'])
    })

    it('should parse custom prefixes', () => {
        expect(getParsedCommand('!start foo "bar baz"', 'start', { prefixes: '!' })).toEqual([
            'start',
            'foo',
            'bar baz',
        ])
    })

    it('should be case insensitive by default', () => {
        expect(getParsedCommand('/START foo', 'start')).toEqual(['start', 'foo'])
        expect(getParsedCommand('/START foo BAR', 'start')).toEqual(['start', 'foo', 'BAR'])
    })

    it('should be case sensitive if asked', () => {
        expect(getParsedCommand('/START foo', 'start', { caseSensitive: true })).toEqual(null)
        expect(getParsedCommand('/START foo', 'START', { caseSensitive: true })).toEqual(['START', 'foo'])
    })

    it('should accept multiple commands to match', () => {
        expect(getParsedCommand('/foo', ['foo', 'bar'])).toEqual(['foo'])
        expect(getParsedCommand('/bar', ['foo', 'bar'])).toEqual(['bar'])
        expect(getParsedCommand('/baz', ['foo', 'bar'])).toEqual(null)
    })
})

describe('filters.deeplink', () => {
    it('should only match given param', () => {
        const ctx = createMessageContext({
            message: '/start foo',
            peerId: { _: 'peerUser', userId: 1 },
        })

        expect(deeplink('bar')(ctx)).toEqual(false)
        expect(deeplink('foo')(ctx)).toEqual(true)
        // eslint-disable-next-line
        expect((ctx as any).command).toEqual(['start', 'foo'])
    })

    it('should add regex matches', () => {
        const ctx = createMessageContext({
            message: '/start foo_123',
            peerId: { _: 'peerUser', userId: 1 },
        })

        expect(deeplink(/^foo_(\d+)$/)(ctx)).toEqual(true)
        // eslint-disable-next-line
        expect((ctx as any).command).toEqual(['start', 'foo_123', '123'])
    })

    it('should accept multiple params', () => {
        const ctx = createMessageContext({
            message: '/start foo',
            peerId: { _: 'peerUser', userId: 1 },
        })

        expect(deeplink(['foo', 'bar'])(ctx)).toEqual(true)
        // eslint-disable-next-line
        expect((ctx as any).command).toEqual(['start', 'foo'])
    })

    it('should accept multiple regex params', () => {
        const ctx = createMessageContext({
            message: '/start foo',
            peerId: { _: 'peerUser', userId: 1 },
        })

        expect(deeplink([/foo/, /bar/])(ctx)).toEqual(true)
        // eslint-disable-next-line
        expect((ctx as any).command).toEqual(['start', 'foo'])
    })

    it('should fail for >1 arguments', () => {
        const ctx = createMessageContext({
            message: '/start foo bar',
            peerId: { _: 'peerUser', userId: 1 },
        })

        expect(deeplink('foo')(ctx)).toEqual(false)
    })

    it('should fail for non-pm messages', () => {
        const ctx = createMessageContext({
            message: '/start foo',
            peerId: { _: 'peerChannel', channelId: 1 },
        })

        expect(deeplink('foo')(ctx)).toEqual(false)
    })
})
