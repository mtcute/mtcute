import { expect } from 'chai'
import { describe, it } from 'mocha'

import {
    computeConstructorIdFromEntry,
    computeConstructorIdFromString,
    TlArgument,
    TlEntry,
} from '../src'

describe('computeConstructorIdFromString', () => {
    const test = (tl: string, expected: number) => {
        expect(computeConstructorIdFromString(tl)).eq(expected)
    }

    it('computes for constructors without parameters', () => {
        test('auth.logOut = Bool;', 0x5717da40)
        test('auth.resetAuthorizations = Bool;', 0x9fab0d1a)
    })

    it('ignores existing constructor id', () => {
        test('auth.logOut#aef001df = Bool;', 0x5717da40)
    })

    it('computes for constructors with simple parameters', () => {
        test(
            'auth.exportAuthorization dc_id:int = auth.ExportedAuthorization;',
            0xe5bfffcd,
        )
    })

    it('computes for constructors with vector parameters', () => {
        test(
            'account.deleteSecureValue types:Vector<SecureValueType> = Bool;',
            0xb880bc4b,
        )
    })

    it('computes for constructors with vector return type', () => {
        test(
            'account.getSecureValue types:Vector<SecureValueType> = Vector<SecureValue>;',
            0x73665bc2,
        )
    })

    it('computes for constructors with optional parameters', () => {
        test(
            'account.uploadTheme flags:# file:InputFile thumb:flags.0?InputFile file_name:string mime_type:string = Document;',
            0x1c3db333,
        )
    })

    it('computes for constructors with optional true parameters', () => {
        test(
            'account.installTheme flags:# dark:flags.0?true format:flags.1?string theme:flags.1?InputTheme = Bool;',
            0x7ae43737,
        )
    })

    it('computes for constructors with generics', () => {
        test('invokeAfterMsg {X:Type} msg_id:long query:!X = X;', 0xcb9f372d)
    })
})

describe('computeConstructorIdFromEntry', () => {
    const make = (name: string, type: string, ...args: string[]): TlEntry => ({
        kind: 'class',
        id: 0,
        name,
        type,
        arguments: args.map((arg) => {
            const a = arg.split(':')
            const t = a[1].split('?')

            if (t[1]) {
                return {
                    name: a[0],
                    type: t[1],
                    typeModifiers: {
                        predicate: t[0],
                    },
                } satisfies TlArgument
            }

            return {
                name: a[0],
                type: t[0],
            }
        }),
    })

    const test = (tl: TlEntry, expected: number) => {
        expect(computeConstructorIdFromEntry(tl)).eq(expected)
    }

    it('computes for constructors without parameters', () => {
        test(make('auth.logOut', 'Bool'), 0x5717da40)
        test(make('auth.resetAuthorizations', 'Bool'), 0x9fab0d1a)
    })

    it('ignores existing constructor id', () => {
        const entry = make('auth.logOut', 'Bool')
        entry.id = 0xaef001df
        test(entry, 0x5717da40)
    })

    it('computes for constructors with simple parameters', () => {
        test(
            make(
                'auth.exportAuthorization',
                'auth.ExportedAuthorization',
                'dc_id:int',
            ),
            0xe5bfffcd,
        )
    })

    it('computes for constructors with vector parameters', () => {
        test(
            make(
                'account.deleteSecureValue',
                'Bool',
                'types:Vector<SecureValueType>',
            ),
            0xb880bc4b,
        )
    })

    it('computes for constructors with vector return type', () => {
        test(
            make(
                'account.getSecureValue',
                'Vector<SecureValue>',
                'types:Vector<SecureValueType>',
            ),
            0x73665bc2,
        )
    })

    it('computes for constructors with optional parameters', () => {
        test(
            make(
                'account.uploadTheme',
                'Document',
                'flags:#',
                'file:InputFile',
                'thumb:flags.0?InputFile',
                'file_name:string',
                'mime_type:string',
            ),
            0x1c3db333,
        )
    })

    it('computes for constructors with optional true parameters', () => {
        test(
            make(
                'account.installTheme',
                'Bool',
                'flags:#',
                'dark:flags.0?true',
                'format:flags.1?string',
                'theme:flags.1?InputTheme',
            ),
            0x7ae43737,
        )
    })

    it('computes for constructors with generics', () => {
        const entry = make('invokeAfterMsg', 'X', 'msg_id:long', 'query:!X')
        entry.generics = [
            {
                name: 'X',
                type: 'Type',
            },
        ]
        test(entry, 0xcb9f372d)
    })
})
