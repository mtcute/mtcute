import { expect } from 'chai'
import { describe, it } from 'mocha'

import { parseTlToEntries } from '../src'
import { calculateStaticSizes } from '../src/calculator'

describe('calculateStaticSizes', () => {
    const test = (tl: string, expected: object) => {
        expect(calculateStaticSizes(parseTlToEntries(tl))).eql(expected)
    }

    it('computes for constructors without parameters', () => {
        test('auth.logOut = Bool;', { 'auth.logOut': 4 })
    })

    it('computes for constructors with static parameters', () => {
        test('auth.exportAuthorization#e5bfffcd dc_id:int = auth.ExportedAuthorization;', {
            'auth.exportAuthorization': 8,
        })
    })

    it('correctly skips true fields', () => {
        test('help.promoData#8c39793f flags:# proxy:flags.0?true expires:int = help.PromoData;', {
            'help.promoData': 12,
        })
    })

    it('correctly skips constructors with predicated fields', () => {
        test(
            'help.promoData#8c39793f flags:# proxy:flags.0?true expires:int peer:Peer psa_type:flags.1?string psa_message:flags.2?string = help.PromoData;',
            {},
        )
    })

    it('correctly skips constructors with non-static fields', () => {
        test('help.promoData#8c39793f psa_type:string psa_message:string = help.PromoData;', {})
    })

    it('correctly skips constructors with vector fields', () => {
        test('help.promoData#8c39793f psa_type:Vector<int> = help.PromoData;', {})
    })

    it('correctly handles static-sized children', () => {
        test(
            'peerUser#9db1bc6d user_id:int53 = Peer;\n' +
                'help.promoData#8c39793f flags:# proxy:flags.0?true expires:int peer:peerUser = help.PromoData;',
            {
                peerUser: 12,
                'help.promoData': 20,
            },
        )
    })

    it('correctly handles static-sized union children', () => {
        test(
            'peerUser#9db1bc6d user_id:int53 = Peer;\n' +
                'peerChannel#9db1bc6d channel_id:int53 = Peer;\n' +
                'help.promoData#8c39793f flags:# proxy:flags.0?true expires:int peer:Peer = help.PromoData;',
            {
                peerUser: 12,
                peerChannel: 12,
                'help.promoData': 24,
            },
        )
    })
})
