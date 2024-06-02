/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, expect, it } from 'vitest'

import { links } from './index.js'

describe('Deep links', function () {
    describe('Video chat links', () => {
        it('should generate t.me/username?videochat links', () => {
            expect(links.videoChat({ username: 'username' })).eq('https://t.me/username?videochat')
            expect(links.videoChat({ username: 'username', inviteHash: 'invite_hash' })).eq(
                'https://t.me/username?videochat=invite_hash',
            )
        })

        it('should generate t.me/username?livestream links', () => {
            expect(links.videoChat({ username: 'username', isLivestream: true })).eq('https://t.me/username?livestream')
            expect(links.videoChat({ username: 'username', inviteHash: 'invite_hash', isLivestream: true })).eq(
                'https://t.me/username?livestream=invite_hash',
            )
        })

        it('should generate tg://resolve?domain=username&videochat links', () => {
            expect(links.videoChat({ username: 'username', protocol: 'tg' })).eq(
                'tg://resolve?domain=username&videochat',
            )
            expect(links.videoChat({ username: 'username', inviteHash: 'invite_hash', protocol: 'tg' })).eq(
                'tg://resolve?domain=username&videochat=invite_hash',
            )
        })

        it('should generate tg://resolve?domain=username&livestream links', () => {
            expect(links.videoChat({ username: 'username', isLivestream: true, protocol: 'tg' })).eq(
                'tg://resolve?domain=username&livestream',
            )
            expect(
                links.videoChat({
                    username: 'username',
                    inviteHash: 'invite_hash',
                    isLivestream: true,
                    protocol: 'tg',
                }),
            ).eq('tg://resolve?domain=username&livestream=invite_hash')
        })

        it('should parse t.me/username?videochat links', () => {
            expect(links.videoChat.parse('https://t.me/username?videochat')).eql({
                username: 'username',
                inviteHash: undefined,
                isLivestream: false,
            })
            expect(links.videoChat.parse('https://t.me/username?videochat=invite_hash')).eql({
                username: 'username',
                inviteHash: 'invite_hash',
                isLivestream: false,
            })
        })

        it('should parse t.me/username?livestream links', () => {
            expect(links.videoChat.parse('https://t.me/username?livestream')).eql({
                username: 'username',
                inviteHash: undefined,
                isLivestream: true,
            })
            expect(links.videoChat.parse('https://t.me/username?livestream=invite_hash')).eql({
                username: 'username',
                inviteHash: 'invite_hash',
                isLivestream: true,
            })
        })

        it('should parse tg://resolve?domain=username&videochat links', () => {
            expect(links.videoChat.parse('tg://resolve?domain=username&videochat')).eql({
                username: 'username',
                inviteHash: undefined,
                isLivestream: false,
            })
            expect(links.videoChat.parse('tg://resolve?domain=username&videochat=invite_hash')).eql({
                username: 'username',
                inviteHash: 'invite_hash',
                isLivestream: false,
            })
        })

        it('should parse tg://resolve?domain=username&livestream links', () => {
            expect(links.videoChat.parse('tg://resolve?domain=username&livestream')).eql({
                username: 'username',
                inviteHash: undefined,
                isLivestream: true,
            })
            expect(links.videoChat.parse('tg://resolve?domain=username&livestream=invite_hash')).eql({
                username: 'username',
                inviteHash: 'invite_hash',
                isLivestream: true,
            })
        })

        it('should parse tg://resolve?domain=username&voicechat links', () => {
            expect(links.videoChat.parse('tg://resolve?domain=username&voicechat')).eql({
                username: 'username',
                inviteHash: undefined,
                isLivestream: false,
            })
            expect(links.videoChat.parse('tg://resolve?domain=username&voicechat=invite_hash')).eql({
                username: 'username',
                inviteHash: 'invite_hash',
                isLivestream: false,
            })
        })
    })

    describe('Share links', () => {
        it('should generate t.me/share?url=link links', () => {
            expect(links.share({ url: 'link' })).eq('https://t.me/share?url=link')
            expect(links.share({ url: 'link', text: 'text' })).eq('https://t.me/share?url=link&text=text')
        })

        it('should generate tg://msg_url?url=link links', () => {
            expect(links.share({ url: 'link', protocol: 'tg' })).eq('tg://msg_url?url=link')
            expect(links.share({ url: 'link', text: 'text', protocol: 'tg' })).eq('tg://msg_url?url=link&text=text')
        })

        it('should parse t.me/share?url=link links', () => {
            expect(links.share.parse('https://t.me/share?url=link')).eql({ url: 'link', text: undefined })
            expect(links.share.parse('https://t.me/share?url=link&text=text')).eql({ url: 'link', text: 'text' })
        })

        it('should parse tg://msg_url?url=link links', () => {
            expect(links.share.parse('tg://msg_url?url=link')).eql({ url: 'link', text: undefined })
            expect(links.share.parse('tg://msg_url?url=link&text=text')).eql({ url: 'link', text: 'text' })
        })
    })

    describe('Stickerset links', () => {
        it('should generate t.me/addstickers/<slug> links', () => {
            expect(links.stickerset({ slug: 'slug' })).eq('https://t.me/addstickers/slug')
            expect(links.stickerset({ slug: 'slug', emoji: true })).eq('https://t.me/addemoji/slug')
        })

        it('should generate tg://addstickers?set=<slug> links', () => {
            expect(links.stickerset({ slug: 'slug', protocol: 'tg' })).eq('tg://addstickers?set=slug')
            expect(links.stickerset({ slug: 'slug', emoji: true, protocol: 'tg' })).eq('tg://addemoji?set=slug')
        })

        it('should parse t.me/addstickers/<slug> links', () => {
            expect(links.stickerset.parse('https://t.me/addstickers/slug')).eql({ slug: 'slug', emoji: false })
            expect(links.stickerset.parse('https://t.me/addemoji/slug')).eql({ slug: 'slug', emoji: true })
        })

        it('should parse tg://addstickers?set=<slug> links', () => {
            expect(links.stickerset.parse('tg://addstickers?set=slug')).eql({ slug: 'slug', emoji: false })
            expect(links.stickerset.parse('tg://addemoji?set=slug')).eql({ slug: 'slug', emoji: true })
        })
    })

    describe('Boost links', () => {
        it('should generate t.me/username?boost links', () => {
            expect(links.boost({ username: 'username' })).eq('https://t.me/username?boost')
        })

        it('should generate t.me/c/id?boost links', () => {
            expect(links.boost({ channelId: 123 })).eq('https://t.me/c/123?boost')
        })

        it('should generate tg://boost?domain=username links', () => {
            expect(links.boost({ username: 'username', protocol: 'tg' })).eq('tg://boost?domain=username')
        })

        it('should generate tg://boost?channel=id links', () => {
            expect(links.boost({ channelId: 123, protocol: 'tg' })).eq('tg://boost?channel=123')
        })

        it('should parse t.me/username?boost links', () => {
            expect(links.boost.parse('https://t.me/username?boost')).eql({ username: 'username' })
        })

        it('should parse t.me/c/id?boost links', () => {
            expect(links.boost.parse('https://t.me/c/123?boost')).eql({ channelId: 123 })
        })

        it('should parse tg://boost?domain=username links', () => {
            expect(links.boost.parse('tg://boost?domain=username')).eql({ username: 'username' })
        })

        it('should parse tg://boost?channel=id links', () => {
            expect(links.boost.parse('tg://boost?channel=123')).eql({ channelId: 123 })
        })
    })

    describe('Shared folder links', () => {
        it('should generate tg://addlist?slug=XXX links', () => {
            expect(links.folder({ slug: 'XXX', protocol: 'tg' })).eq('tg://addlist?slug=XXX')
        })

        it('should generate https://t.me/addlist/XXX links', () => {
            expect(links.folder({ slug: 'XXX' })).eq('https://t.me/addlist/XXX')
        })

        it('should parse tg://addlist?slug=XXX links', () => {
            expect(links.folder.parse('tg://addlist?slug=XXX')).eql({ slug: 'XXX' })
        })

        it('should parse https://t.me/addlist/XXX links', () => {
            expect(links.folder.parse('https://t.me/addlist/XXX')).eql({ slug: 'XXX' })
        })
    })
})
