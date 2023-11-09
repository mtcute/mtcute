import { describe, expect, it } from 'vitest'

import { generateTlEntriesDifference, generateTlSchemasDifference } from './diff.js'
import { parseTlToEntries } from './parse.js'
import { parseFullTlSchema } from './schema.js'
import { TlEntryDiff, TlSchemaDiff } from './types.js'

describe('generateTlEntriesDifference', () => {
    const test = (tl: string[], expected?: TlEntryDiff) => {
        const e = parseTlToEntries(tl.join('\n'))
        const res = generateTlEntriesDifference(e[0], e[1])
        expect(res).toEqual(expected)
    }

    it('shows id diff', () => {
        test(['test#deadbeef = Test;', 'test#baadf00d = Test;'], {
            name: 'test',
            id: {
                old: 0xdeadbeef,
                new: 0xbaadf00d,
            },
        })
    })

    it('shows comments diff', () => {
        test(['test = Test;', '// Some comment', 'test = Test;'], {
            name: 'test',
            comment: {
                old: undefined,
                new: 'Some comment',
            },
        })
    })

    it('shows generics diff', () => {
        test(['test#1 {X:Type} = Test;', 'test#1 = Test;'], {
            name: 'test',
            generics: {
                old: [
                    {
                        name: 'X',
                        type: 'Type',
                    },
                ],
                new: undefined,
            },
        })
        test(['test#1 {X:Type} = Test;', 'test#1 {Y:Type} = Test;'], {
            name: 'test',
            generics: {
                old: [
                    {
                        name: 'X',
                        type: 'Type',
                    },
                ],
                new: [
                    {
                        name: 'Y',
                        type: 'Type',
                    },
                ],
            },
        })
    })

    it('shows args diff', () => {
        test(['test#1 foo:int bar:int egg:flags.0?Egg = Test;', 'test#1 foo:Foo baz:int egg:flags.1?Egg = Test;'], {
            name: 'test',
            arguments: {
                added: [
                    {
                        name: 'baz',
                        type: 'int',
                    },
                ],
                removed: [
                    {
                        name: 'bar',
                        type: 'int',
                    },
                ],
                modified: [
                    {
                        name: 'foo',
                        type: {
                            old: 'int',
                            new: 'Foo',
                        },
                    },
                    {
                        name: 'egg',
                        type: {
                            old: 'flags.0?Egg',
                            new: 'flags.1?Egg',
                        },
                    },
                ],
            },
        })
    })

    it('shows args comments diff', () => {
        test(['// @description a @foo Foo\ntest foo:int = Test;', '// @description a @foo Bar\ntest foo:int = Test;'], {
            name: 'test',
            arguments: {
                added: [],
                removed: [],
                modified: [
                    {
                        name: 'foo',
                        comment: {
                            old: 'Foo',
                            new: 'Bar',
                        },
                    },
                ],
            },
        })
    })

    it('throws on incompatible entries', () => {
        expect(() => test(['test1 = Test;', 'test2 = Test;'])).toThrow()
        expect(() => test(['test = Test1;', 'test = Test2;'])).toThrow()
    })
})

describe('generateTlSchemasDifference', () => {
    const test = (tl1: string[], tl2: string[]) => {
        const a = parseFullTlSchema(parseTlToEntries(tl1.join('\n')))
        const b = parseFullTlSchema(parseTlToEntries(tl2.join('\n')))
        const res: Partial<TlSchemaDiff> = generateTlSchemasDifference(a, b)

        expect(res).toMatchSnapshot()
    }

    it('shows added constructors', () => {
        test(['test1 = Test;'], ['test1 = Test;', 'test2 = Test;'])
    })

    it('shows removed constructors', () => {
        test(['test1 = Test;', 'test2 = Test;'], ['test1 = Test;'])
    })

    it('shows modified constructors', () => {
        test(['test foo:int = Test;'], ['test foo:Foo = Test;'])
    })

    it('shows removed unions', () => {
        test(['test foo:int = Test;', 'test1 = Test1;'], ['test foo:Foo = Test;'])
    })

    it('shows added unions', () => {
        test(['test foo:int = Test;'], ['test foo:Foo = Test;', 'test1 = Test1;'])
    })

    it('shows modified unions', () => {
        test(['test foo:int = Test;', 'test1 = Test;'], ['test foo:Foo = Test;', 'test2 = Test;'])

        test(['test foo:int = Test;', 'test1 = Test;'], ['test2 foo:Foo = Test;', 'test3 = Test;'])

        test(['test = Test;', 'test1 = Test;'], ['test = Test1;', 'test1 = Test1;'])
    })

    it('shows modified methods', () => {
        test(['---functions---', 'test = Test;'], ['---functions---', 'test = Test2;'])
    })
})
