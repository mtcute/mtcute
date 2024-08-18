import { describe, expect, it } from 'vitest'

import { parseTlToEntries } from '../parse.js'
import { parseFullTlSchema } from '../schema.js'

import { generateTypescriptDefinitionsForTlEntry, generateTypescriptDefinitionsForTlSchema } from './types.js'

describe('generateTypescriptDefinitionsForTlEntry', () => {
    const test = (...tl: string[]) => {
        const entry = parseTlToEntries(tl.join('\n'), { parseMethodTypes: true })[0]
        expect(generateTypescriptDefinitionsForTlEntry(entry)).toMatchSnapshot()
    }

    it('replaces primitive types', () => {
        test('test a:int b:long c:double d:string e:bytes f:Bool g:vector<int> = Test;')
    })

    it('ignores namespace for name', () => {
        test('test.test = Test;')
    })

    it('renames non-primitive types', () => {
        test('test foo:Foo bar:vector<Bar> baz:namespace.Baz egg:vector<namespace.Egg> = Test;')
    })

    it('marks optional fields as optional', () => {
        test('test flags:# a:flags.0?true b:flags.1?string c:flags.2?Foo d:flags.3?vector<namespace.Foo> = Test;')
    })

    describe('comments', () => {
        it('adds tl style comments', () => {
            test('// This is a test constructor', 'test = Test;')
        })

        it('adds return type comments', () => {
            test('---functions---', '// This is a test method', 'test = Test;')
            test('---functions---', '// This is a test method', 'test = Test;')
            test('---functions---\n', '// This is a test method\n', 'test = Vector<Test>;')
        })

        it('adds usage info comments', () => {
            const entries = parseTlToEntries('---functions---\ntest = Test;\ntestBot = Test;')
            const [result, resultBot] = entries.map(it =>
                generateTypescriptDefinitionsForTlEntry(it, 'tl.', {
                    base: {},
                    errors: {},
                    throws: { test: ['FOO', 'BAR'] },
                    userOnly: { test: 1 },
                    botOnly: { testBot: 1 },
                }),
            )

            expect(result).toMatchSnapshot()
            expect(resultBot).toMatchSnapshot()
        })

        it('adds tdlib style comments', () => {
            test('// @description This is a test constructor', '// @field Some field', 'test field:int = Test;')
        })

        it('wraps long comments', () => {
            test(
                '// This is a test constructor with a very very very very very very very very long comment',
                'test = Test;',
            )

            test(
                '---functions---',
                '// This is a test method with a very very very very very very very very long comment',
                'test = Test;',
            )
        })

        it('should not break @link tags', () => {
            test('// This is a test constructor with a very long comment {@link whatever} more text', 'test = Test;')
        })
    })

    it('writes generic types', () => {
        test('---functions---\ninvokeWithoutUpdates#bf9459b7 {X:Type} query:!X = X;')
    })

    it('generates code with raw flags for constructors with flags', () => {
        const entry = parseTlToEntries('test flags:# flags2:# = Test;')[0]
        expect(generateTypescriptDefinitionsForTlEntry(entry, undefined, undefined, true)).toMatchSnapshot()
    })
})

describe('generateTypescriptDefinitionsForTlSchema', () => {
    const test = (...tl: string[]) => {
        const entries = parseTlToEntries(tl.join('\n'))
        const schema = parseFullTlSchema(entries)

        let [codeTs, codeJs] = generateTypescriptDefinitionsForTlSchema(schema, 0)

        // skip prelude
        codeTs = codeTs.substring(codeTs.indexOf('-readonly [P in keyof T]: T[P]') + 37, codeTs.length - 1)
        // unindent first level
        codeTs = codeTs.replace(/^ {4}/gm, '')

        // skip prelude
        codeJs = codeJs.substring(codeJs.indexOf('ns.LAYER = 0;') + 14, codeJs.length - 15)

        expect(codeTs.trim()).toMatchSnapshot()
        expect(codeJs.trim()).toMatchSnapshot()
    }

    it('writes simple schemas', () => {
        test('test = Test;')
    })

    it('writes schemas with multi-unions', () => {
        test('test = Test;\ntest2 = Test;')
    })

    it('writes schemas with methods', () => {
        test('test = Test;\n---functions---\ngetTest = Test;')
    })

    it('writes schemas with namespaces', () => {
        test(
            'test = Test;\n',
            'test2 = Test;\n',
            'test.test = test.Test;\n',
            'test.test2 = test.Test;\n',
            '---functions---\n',
            'getTest = Test;\n',
            'test.getTest = test.Test;',
        )
    })
})
