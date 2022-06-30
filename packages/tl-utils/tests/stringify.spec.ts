import { describe, it } from 'mocha'
import { expect } from 'chai'

import { TlEntry } from '../src/types'
import { writeTlEntryToString } from '../src/stringify'

describe('writeTlEntryToString', () => {
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
                    predicate: t[0],
                }
            } else {
                return {
                    name: a[0],
                    type: t[0],
                }
            }
        }),
    })

    const test = (tl: TlEntry, expected: string) => {
        expect(writeTlEntryToString(tl)).eq(expected)
    }

    it('writes constructors without parameters', () => {
        test(make('auth.logOut', 'Bool'), 'auth.logOut = Bool;')
        test(
            make('auth.resetAuthorizations', 'Bool'),
            'auth.resetAuthorizations = Bool;'
        )
    })

    it('writes constructor id if available', () => {
        const entry = make('auth.logOut', 'Bool')
        entry.id = 0xaef001df
        test(entry, 'auth.logOut#aef001df = Bool;')
    })

    it('writes constructors with simple parameters', () => {
        test(
            make(
                'auth.exportAuthorization',
                'auth.ExportedAuthorization',
                'dc_id:int'
            ),
            'auth.exportAuthorization dc_id:int = auth.ExportedAuthorization;'
        )
    })

    it('computes for constructors with vector parameters', () => {
        test(
            make(
                'account.deleteSecureValue',
                'Bool',
                'types:Vector<SecureValueType>'
            ),
            'account.deleteSecureValue types:Vector<SecureValueType> = Bool;'
        )
    })

    it('computes for constructors with vector return type', () => {
        test(
            make(
                'account.getSecureValue',
                'Vector<SecureValue>',
                'types:Vector<SecureValueType>'
            ),
            'account.getSecureValue types:Vector<SecureValueType> = Vector<SecureValue>;'
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
                'mime_type:string'
            ),
            'account.uploadTheme flags:# file:InputFile thumb:flags.0?InputFile file_name:string mime_type:string = Document;'
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
                'theme:flags.1?InputTheme'
            ),
            'account.installTheme flags:# dark:flags.0?true format:flags.1?string theme:flags.1?InputTheme = Bool;'
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
        test(entry, 'invokeAfterMsg {X:Type} msg_id:long query:!X = X;')
    })
})
