import { expect } from 'chai'
import { describe, it } from 'mocha'

import {
    mergeTlEntries,
    mergeTlSchemas,
    parseFullTlSchema,
    parseTlToEntries,
    writeTlEntriesToString,
    writeTlEntryToString,
} from '../src'

describe('mergeTlEntries', () => {
    const test = (tl: string, expected: string) => {
        const res = mergeTlEntries(parseTlToEntries(tl))

        if (typeof res === 'string') {
            expect(res).eq(expected)
        } else {
            expect(writeTlEntryToString(res)).eq(expected)
        }
    }

    it('fails on conflicting kinds', () => {
        test('test = Test;\n---functions---\ntest = Test;', 'basic info mismatch')
    })

    it('fails on conflicting names', () => {
        test('test1 = Test;\ntest2 = Test;', 'basic info mismatch')
    })

    it('fails on conflicting types', () => {
        test('test = Test1;\ntest = Test2;', 'basic info mismatch')
    })

    it('fails on conflicting ids', () => {
        test('test = Test;\ntest foo:int = Test;', 'basic info mismatch')
    })

    it('merges true flags', () => {
        test(
            'test flags:# = Test;\n' +
                'test flags:# foo:flags.0?true = Test;\n' +
                'test flags:# bar:flags.0?true = Test;\n' +
                'test flags:# baz:flags.1?true = Test;',
            'test#e86481ba flags:# foo:flags.0?true bar:flags.0?true baz:flags.1?true = Test;',
        )
        // ordering of optional flags should not matter
        test(
            'test flags:# foo:flags.0?true = Test;\n' +
                'test flags:# bar:flags.0?true = Test;\n' +
                'test flags:# baz:flags.1?true = Test;',
            'test#e86481ba flags:# foo:flags.0?true bar:flags.0?true baz:flags.1?true = Test;',
        )
        test(
            'test flags:# foo:flags.0?true = Test;\n' +
                'test flags:# foo:flags.0?true bar:flags.0?true = Test;\n' +
                'test flags:# baz:flags.1?true = Test;\n' +
                'test flags:# bar:flags.0?true baz:flags.1?true = Test;',
            'test#e86481ba flags:# foo:flags.0?true bar:flags.0?true baz:flags.1?true = Test;',
        )
    })

    it('merges true flags with multiple flags fields', () => {
        test(
            'test flags:# flags2:# = Test;\n' +
                'test flags:# foo:flags.0?true flags2:# = Test;\n' +
                'test flags:# flags2:# bar:flags2.0?true = Test;\n',
            'test#5ca39a98 flags:# foo:flags.0?true flags2:# bar:flags2.0?true = Test;',
        )
    })
})

describe('mergeTlSchemas', () => {
    const test = async (schemas: string[][], onConflict: number, ...expected: string[]) => {
        const res = await mergeTlSchemas(
            schemas.map((tl) => parseFullTlSchema(parseTlToEntries(tl.join('\n')))),
            (opts) => opts[onConflict],
        )

        expect(
            writeTlEntriesToString(res.entries, {
                omitPrimitives: true,
                tdlibComments: true,
            }),
        ).eq(expected.join('\n'))
    }

    it('merges different constructors', async () => {
        await test(
            [['testClass = Test;'], ['testClass2 = Test;'], ['---functions---', 'testMethod = Test;']],
            0,
            'testClass#5d60a438 = Test;',
            'testClass2#39c5c841 = Test;',
            '---functions---',
            'testMethod#87d8a7d2 = Test;',
        )
    })

    it('merges true flags in constructors', async () => {
        await test(
            [
                ['test foo:flags.0?true = Test;'],
                ['test bar:flags.0?true = Test;'],
                ['test foo:flags.0?true bar:flags.0?true = Test;'],
            ],
            0,
            'test#1c173316 foo:flags.0?true bar:flags.0?true = Test;',
        )
    })

    it('resolves conflict using user-provided option', async () => {
        await test(
            [['test foo:int = Test;'], ['test bar:int = Test;'], ['test baz:int = Test;']],
            0,
            'test#4f6455cd foo:int = Test;',
        )
        await test(
            [['test foo:int = Test;'], ['test bar:int = Test;'], ['test baz:int = Test;']],
            1,
            'test#3e993a74 bar:int = Test;',
        )
        await test([['test foo:int = Test;'], [], ['test bar:int = Test;']], 1, '')
    })

    it('merges comments', async () => {
        await test(
            [
                ['test foo:flags.0?true = Test;'],
                ['// test ctor', 'test bar:flags.0?true = Test;'],
                ['// will be ignored', 'test foo:flags.0?true bar:flags.0?true = Test;'],
            ],
            0,
            '// @description test ctor',
            'test#1c173316 foo:flags.0?true bar:flags.0?true = Test;',
        )
    })

    it('merges arguments comments', async () => {
        await test(
            [
                ['test foo:flags.0?true = Test;'],
                ['// @description test @bar bar comment', 'test bar:flags.0?true = Test;'],
                ['// @description test @foo foo comment', 'test foo:flags.0?true bar:flags.0?true = Test;'],
            ],
            0,
            '// @description test',
            '// @foo foo comment',
            '// @bar bar comment',
            'test#1c173316 foo:flags.0?true bar:flags.0?true = Test;',
        )
    })
})
