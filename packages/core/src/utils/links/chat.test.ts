/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, expect, it } from 'vitest'

import { links } from './index.js'

describe('Deep links', function () {
    describe('Chat invite links', () => {
        it('should generate t.me/+hash links', () => {
            expect(links.chatInvite({ hash: 'hash' })).eq('https://t.me/+hash')
        })

        it('should generate tg://join?invite=hash links', () => {
            expect(links.chatInvite({ hash: 'hash', protocol: 'tg' })).eq('tg://join?invite=hash')
        })

        it('should parse t.me/joinchat/hash links', () => {
            expect(links.chatInvite.parse('https://t.me/joinchat/hash')).eql({ hash: 'hash' })
        })

        it('should parse t.me/+hash links', () => {
            expect(links.chatInvite.parse('https://t.me/+hash')).eql({ hash: 'hash' })
        })

        it('should parse tg://join?invite=hash links', () => {
            expect(links.chatInvite.parse('tg://join?invite=hash')).eql({ hash: 'hash' })
        })
    })

    describe('Chat folder links', () => {
        it('should generate t.me/addlist/slug links', () => {
            expect(links.chatFolder({ slug: 'slug' })).eq('https://t.me/addlist/slug')
        })

        it('should generate tg://addlist?slug=slug links', () => {
            expect(links.chatFolder({ slug: 'slug', protocol: 'tg' })).eq('tg://addlist?slug=slug')
        })

        it('should parse t.me/addlist/slug links', () => {
            expect(links.chatFolder.parse('https://t.me/addlist/slug')).eql({ slug: 'slug' })
        })

        it('should parse tg://addlist?slug=slug links', () => {
            expect(links.chatFolder.parse('tg://addlist?slug=slug')).eql({ slug: 'slug' })
        })
    })

    describe('Message links', () => {
        const result = (it: object) => {
            return {
                threadId: undefined,
                commentId: undefined,
                mediaTimestamp: undefined,
                single: false,
                ...it,
            }
        }

        it('should generate t.me/username/id links', () => {
            expect(links.message({ username: 'username', id: 123 })).eq('https://t.me/username/123')
            expect(links.message({ username: 'username', threadId: 123, id: 456 })).eq('https://t.me/username/123/456')
        })

        it('should generate tg:// links', () => {
            expect(links.message({ username: 'username', id: 123, protocol: 'tg' })).eq(
                'tg://resolve?domain=username&post=123',
            )
            expect(links.message({ username: 'username', threadId: 123, id: 456, protocol: 'tg' })).eq(
                'tg://resolve?domain=username&post=456&thread=123',
            )
        })

        it('should generate t.me/c/channel/id links', () => {
            expect(links.message({ channelId: 321, id: 123 })).eq('https://t.me/c/321/123')
            expect(links.message({ channelId: 321, threadId: 123, id: 456 })).eq('https://t.me/c/321/123/456')
        })

        it('should generate tg://privatepost links', () => {
            expect(links.message({ channelId: 321, id: 123, protocol: 'tg' })).eq(
                'tg://privatepost?channel=321&post=123',
            )
            expect(links.message({ channelId: 321, threadId: 123, id: 456, protocol: 'tg' })).eq(
                'tg://privatepost?channel=321&post=456&thread=123',
            )
        })

        it('should parse t.me/username/id links', () => {
            expect(links.message.parse('https://t.me/username/123')).eql(result({ username: 'username', id: 123 }))
        })

        it('should parse t.me/username/thread/id links', () => {
            expect(links.message.parse('https://t.me/username/123/456')).eql(
                result({ username: 'username', threadId: 123, id: 456 }),
            )
        })

        it('should parse tg://resolve links', () => {
            expect(links.message.parse('tg://resolve?domain=username&post=123')).eql(
                result({ username: 'username', id: 123 }),
            )
        })

        it('should parse t.me/c/channel/id links', () => {
            expect(links.message.parse('https://t.me/c/666/123')).eql(result({ channelId: 666, id: 123 }))
        })

        it('should parse t.me/c/channel/thread/id links', () => {
            expect(links.message.parse('https://t.me/c/666/123/456')).eql(
                result({ channelId: 666, threadId: 123, id: 456 }),
            )
        })

        it('should parse tg://privatepost links', () => {
            expect(links.message.parse('tg://privatepost?channel=666&post=123')).eql(
                result({ channelId: 666, id: 123 }),
            )
        })
    })
})
