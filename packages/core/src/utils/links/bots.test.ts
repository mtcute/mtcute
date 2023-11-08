/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, expect, it } from 'vitest'

import { links } from './index.js'

describe('Deep links', function () {
    describe('Bot start links', () => {
        it('should generate t.me/username?start=parameter links', () => {
            expect(links.botStart({ username: 'username', parameter: 'parameter' })).eq(
                'https://t.me/username?start=parameter',
            )
        })

        it('should generate tg://resolve?domain=username&start=parameter links', () => {
            expect(links.botStart({ username: 'username', parameter: 'parameter', protocol: 'tg' })).eq(
                'tg://resolve?domain=username&start=parameter',
            )
        })

        it('should parse t.me/username?start=parameter links', () => {
            expect(links.botStart.parse('https://t.me/username?start=parameter')).eql({
                username: 'username',
                parameter: 'parameter',
            })
        })

        it('should parse tg://resolve?domain=username&start=parameter links', () => {
            expect(links.botStart.parse('tg://resolve?domain=username&start=parameter')).eql({
                username: 'username',
                parameter: 'parameter',
            })
        })
    })

    describe('Bot add to group links', () => {
        it('should generate t.me links', () => {
            expect(links.botAddToGroup({ bot: 'bot_username' })).eq('https://t.me/bot_username?startgroup')
            expect(links.botAddToGroup({ bot: 'bot_username', parameter: '' })).eq(
                'https://t.me/bot_username?startgroup=',
            )
            expect(links.botAddToGroup({ bot: 'bot_username', parameter: 'parameter' })).eq(
                'https://t.me/bot_username?startgroup=parameter',
            )
            expect(links.botAddToGroup({ bot: 'bot_username', admin: ['postStories'] })).eq(
                'https://t.me/bot_username?startgroup&admin=post_stories',
            )
        })

        it('should generate tg://resolve links', () => {
            expect(links.botAddToGroup({ bot: 'bot_username', protocol: 'tg' })).eq(
                'tg://resolve?domain=bot_username&startgroup',
            )
            expect(links.botAddToGroup({ bot: 'bot_username', parameter: 'parameter', protocol: 'tg' })).eq(
                'tg://resolve?domain=bot_username&startgroup=parameter',
            )
            expect(links.botAddToGroup({ bot: 'bot_username', admin: ['postStories'], protocol: 'tg' })).eq(
                'tg://resolve?domain=bot_username&startgroup&admin=post_stories',
            )
        })

        it('should parse t.me links', () => {
            expect(links.botAddToGroup.parse('https://t.me/bot_username?startgroup')).eql({
                bot: 'bot_username',
                parameter: undefined,
                admin: undefined,
            })
            expect(links.botAddToGroup.parse('https://t.me/bot_username?startgroup=parameter')).eql({
                bot: 'bot_username',
                parameter: 'parameter',
                admin: undefined,
            })
            expect(links.botAddToGroup.parse('https://t.me/bot_username?startgroup&admin=post_stories')).eql({
                bot: 'bot_username',
                parameter: undefined,
                admin: ['postStories'],
            })
        })

        it('should parse tg://resolve links', () => {
            expect(links.botAddToGroup.parse('tg://resolve?domain=bot_username&startgroup')).eql({
                bot: 'bot_username',
                parameter: undefined,
                admin: undefined,
            })
            expect(links.botAddToGroup.parse('tg://resolve?domain=bot_username&startgroup=parameter')).eql({
                bot: 'bot_username',
                parameter: 'parameter',
                admin: undefined,
            })
            expect(links.botAddToGroup.parse('tg://resolve?domain=bot_username&startgroup&admin=post_stories')).eql({
                bot: 'bot_username',
                parameter: undefined,
                admin: ['postStories'],
            })
        })
    })

    describe('Bot add to channel links', () => {
        it('should generate t.me links', () => {
            expect(links.botAddToChannel({ bot: 'bot_username' })).eq('https://t.me/bot_username?startchannel')
            expect(links.botAddToChannel({ bot: 'bot_username', admin: ['postStories'] })).eq(
                'https://t.me/bot_username?startchannel&admin=post_stories',
            )
        })

        it('should generate tg://resolve links', () => {
            expect(links.botAddToChannel({ bot: 'bot_username', protocol: 'tg' })).eq(
                'tg://resolve?domain=bot_username&startchannel',
            )
            expect(links.botAddToChannel({ bot: 'bot_username', admin: ['postStories'], protocol: 'tg' })).eq(
                'tg://resolve?domain=bot_username&startchannel&admin=post_stories',
            )
        })

        it('should parse t.me links', () => {
            expect(links.botAddToChannel.parse('https://t.me/bot_username?startchannel')).eql({
                bot: 'bot_username',
                admin: undefined,
            })
            expect(links.botAddToChannel.parse('https://t.me/bot_username?startchannel&admin=post_stories')).eql({
                bot: 'bot_username',
                admin: ['postStories'],
            })
        })

        it('should parse tg://resolve links', () => {
            expect(links.botAddToChannel.parse('tg://resolve?domain=bot_username&startchannel')).eql({
                bot: 'bot_username',
                admin: undefined,
            })
            expect(links.botAddToChannel.parse('tg://resolve?domain=bot_username&startchannel&admin=post_stories')).eql(
                { bot: 'bot_username', admin: ['postStories'] },
            )
        })
    })

    describe('Game links', () => {
        it('should generate t.me links', () => {
            expect(links.botGame({ bot: 'bot_username', game: 'short_name' })).eq(
                'https://t.me/bot_username?game=short_name',
            )
        })

        it('should generate tg://resolve links', () => {
            expect(links.botGame({ bot: 'bot_username', game: 'short_name', protocol: 'tg' })).eq(
                'tg://resolve?domain=bot_username&game=short_name',
            )
        })

        it('should parse t.me links', () => {
            expect(links.botGame.parse('https://t.me/bot_username?game=short_name')).eql({
                bot: 'bot_username',
                game: 'short_name',
            })
        })

        it('should parse tg://resolve links', () => {
            expect(links.botGame.parse('tg://resolve?domain=bot_username&game=short_name')).eql({
                bot: 'bot_username',
                game: 'short_name',
            })
        })
    })

    describe('Named web apps', () => {
        it('should generate t.me links', () => {
            expect(links.botWebApp({ bot: 'bot_username', app: 'short_name' })).eq(
                'https://t.me/bot_username/short_name',
            )
            expect(links.botWebApp({ bot: 'bot_username', app: 'short_name', parameter: 'parameter' })).eq(
                'https://t.me/bot_username/short_name?startapp=parameter',
            )
        })

        it('should generate tg://resolve links', () => {
            expect(links.botWebApp({ bot: 'bot_username', app: 'short_name', protocol: 'tg' })).eq(
                'tg://resolve?domain=bot_username&appname=short_name',
            )
            expect(
                links.botWebApp({ bot: 'bot_username', app: 'short_name', parameter: 'parameter', protocol: 'tg' }),
            ).eq('tg://resolve?domain=bot_username&appname=short_name&startapp=parameter')
        })

        it('should parse t.me links', () => {
            expect(links.botWebApp.parse('https://t.me/bot_username/short_name')).eql({
                bot: 'bot_username',
                app: 'short_name',
                parameter: undefined,
            })
            expect(links.botWebApp.parse('https://t.me/bot_username/short_name?startapp=parameter')).eql({
                bot: 'bot_username',
                app: 'short_name',
                parameter: 'parameter',
            })
        })

        it('should parse tg://resolve links', () => {
            expect(links.botWebApp.parse('tg://resolve?domain=bot_username&appname=short_name')).eql({
                bot: 'bot_username',
                app: 'short_name',
                parameter: undefined,
            })
            expect(links.botWebApp.parse('tg://resolve?domain=bot_username&appname=short_name&startapp=parameter')).eql(
                { bot: 'bot_username', app: 'short_name', parameter: 'parameter' },
            )
        })
    })
})
