/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, expect, it } from 'vitest'

import { links } from './index.js'

describe('Deep links', function () {
    describe('Public username links', () => {
        it('should generate t.me/username links', () => {
            expect(links.publicUsername({ username: 'username' })).eq('https://t.me/username')
        })

        it('should generate tg://resolve?domain=username links', () => {
            expect(links.publicUsername({ username: 'username', protocol: 'tg' })).eq('tg://resolve?domain=username')
        })

        it('should parse t.me/username links', () => {
            expect(links.publicUsername.parse('https://t.me/username')).eql({ username: 'username' })
        })

        it('should not parse t.me/+... links', () => {
            expect(links.publicUsername.parse('https://t.me/+79991231234')).eql(null)
            expect(links.publicUsername.parse('https://t.me/+lAj1jA01-2daJJ')).eql(null)
        })

        it('should not parse t.me/username/123 links', () => {
            expect(links.publicUsername.parse('https://t.me/username/123')).eql(null)
        })

        it('should not parse t.me/username?whatever links', () => {
            expect(links.publicUsername.parse('https://t.me/username?whatever')).eql(null)
        })

        it('should parse tg://resolve?domain=username links', () => {
            expect(links.publicUsername.parse('tg://resolve?domain=username')).eql({ username: 'username' })
        })

        it('should not parse tg://resolve?domain&whatever links', () => {
            expect(links.publicUsername.parse('tg://resolve?domain=username&whatever')).eql(null)
        })
    })

    describe('Temporary profile links', () => {
        it('should generate t.me/contact links', () => {
            expect(links.temporaryProfile({ token: 'abc' })).eq('https://t.me/contact/abc')
        })

        it('should generate tg://contact?token links', () => {
            expect(links.temporaryProfile({ token: 'abc', protocol: 'tg' })).eq('tg://contact?token=abc')
        })

        it('should parse t.me/contact links', () => {
            expect(links.temporaryProfile.parse('https://t.me/contact/abc')).eql({ token: 'abc' })
        })

        it('should parse tg://contact?token links', () => {
            expect(links.temporaryProfile.parse('tg://contact?token=abc')).eql({ token: 'abc' })
        })
    })

    describe('Phone number links', () => {
        it('should generate t.me/+phone links', () => {
            expect(links.phoneNumber({ phone: '79991231234' })).eq('https://t.me/+79991231234')
        })

        it('should generate tg://resolve?phone links', () => {
            expect(links.phoneNumber({ phone: '79991231234', protocol: 'tg' })).eq('tg://resolve?phone=79991231234')
        })

        it('should parse t.me/+phone links', () => {
            expect(links.phoneNumber.parse('https://t.me/+79991231234')).eql({ phone: '79991231234' })
        })

        it('should parse tg://resolve?phone links', () => {
            expect(links.phoneNumber.parse('tg://resolve?phone=79991231234')).eql({ phone: '79991231234' })
        })
    })
})
