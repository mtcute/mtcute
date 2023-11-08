/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, expect, it } from 'vitest'

import { links } from './index.js'

describe('Deep links', function () {
    describe('MTProxy links', () => {
        it('should generate t.me/proxy links', () => {
            expect(
                links.mtproxy({
                    server: 'server',
                    port: 123,
                    secret: 'secret',
                }),
            ).eq('https://t.me/proxy?server=server&port=123&secret=secret')
        })

        it('should generate tg://proxy links', () => {
            expect(
                links.mtproxy({
                    server: 'server',
                    port: 123,
                    secret: 'secret',
                    protocol: 'tg',
                }),
            ).eq('tg://proxy?server=server&port=123&secret=secret')
        })

        it('should parse t.me/proxy links', () => {
            expect(links.mtproxy.parse('https://t.me/proxy?server=server&port=123&secret=secret')).eql({
                server: 'server',
                port: 123,
                secret: 'secret',
            })
        })

        it('should parse tg://proxy links', () => {
            expect(links.mtproxy.parse('tg://proxy?server=server&port=123&secret=secret')).eql({
                server: 'server',
                port: 123,
                secret: 'secret',
            })
        })
    })

    describe('Socks5 links', () => {
        it('should generate t.me/socks links', () => {
            expect(
                links.socks5({
                    server: 'server',
                    port: 123,
                    user: 'user',
                    pass: 'pass',
                }),
            ).eq('https://t.me/socks?server=server&port=123&user=user&pass=pass')
        })

        it('should generate tg://socks links', () => {
            expect(
                links.socks5({
                    server: 'server',
                    port: 123,
                    user: 'user',
                    pass: 'pass',
                    protocol: 'tg',
                }),
            ).eq('tg://socks?server=server&port=123&user=user&pass=pass')
        })

        it('should parse t.me/socks links', () => {
            expect(links.socks5.parse('https://t.me/socks?server=server&port=123&user=user&pass=pass')).eql({
                server: 'server',
                port: 123,
                user: 'user',
                pass: 'pass',
            })
        })

        it('should parse tg://socks links', () => {
            expect(links.socks5.parse('tg://socks?server=server&port=123&user=user&pass=pass')).eql({
                server: 'server',
                port: 123,
                user: 'user',
                pass: 'pass',
            })
        })
    })
})
