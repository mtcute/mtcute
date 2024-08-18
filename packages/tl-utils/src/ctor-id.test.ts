import { describe, expect, it } from 'vitest'

import { computeConstructorIdFromEntry } from './ctor-id.js'

import type { TlArgument, TlEntry } from './index.js'

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
        expect(computeConstructorIdFromEntry(tl)).toEqual(expected)
    }

    it('computes for constructors without parameters', () => {
        test(make('auth.logOut', 'Bool'), 0x5717DA40)
        test(make('auth.resetAuthorizations', 'Bool'), 0x9FAB0D1A)
    })

    it('ignores existing constructor id', () => {
        const entry = make('auth.logOut', 'Bool')
        entry.id = 0xAEF001DF
        test(entry, 0x5717DA40)
    })

    it('computes for constructors with simple parameters', () => {
        test(make('auth.exportAuthorization', 'auth.ExportedAuthorization', 'dc_id:int'), 0xE5BFFFCD)
    })

    it('computes for constructors with vector parameters', () => {
        test(make('account.deleteSecureValue', 'Bool', 'types:Vector<SecureValueType>'), 0xB880BC4B)
    })

    it('computes for constructors with vector return type', () => {
        test(make('account.getSecureValue', 'Vector<SecureValue>', 'types:Vector<SecureValueType>'), 0x73665BC2)
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
            0x1C3DB333,
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
            0x7AE43737,
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
        test(entry, 0xCB9F372D)
    })
})
