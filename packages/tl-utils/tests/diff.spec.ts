import { describe, it } from 'mocha'
import { expect } from 'chai'

import { parseTlToEntries } from '../src/parse'
import { TlEntryDiff, TlSchemaDiff } from '../src/types'
import {
    generateTlEntriesDifference,
    generateTlSchemasDifference,
} from '../src/diff'
import { parseFullTlSchema } from '../src/schema'

describe('generateTlEntriesDifference', () => {
    const test = (tl: string[], expected: TlEntryDiff) => {
        const e = parseTlToEntries(tl.join('\n'))
        const res = generateTlEntriesDifference(e[0], e[1])
        expect(res).eql(expected)
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
        test(
            [
                'test#1 foo:int bar:int egg:flags.0?Egg = Test;',
                'test#1 foo:Foo baz:int egg:flags.1?Egg = Test;',
            ],
            {
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
                            predicate: {
                                old: 'flags.0',
                                new: 'flags.1',
                            },
                        },
                    ],
                },
            }
        )
    })
})

describe('generateTlSchemasDifference', () => {
    const test = (
        tl1: string[],
        tl2: string[],
        expected: Partial<TlSchemaDiff>
    ) => {
        const a = parseFullTlSchema(parseTlToEntries(tl1.join('\n')))
        const b = parseFullTlSchema(parseTlToEntries(tl2.join('\n')))
        const res: Partial<TlSchemaDiff> = generateTlSchemasDifference(a, b)

        if (!('methods' in expected)) delete res.methods
        if (!('classes' in expected)) delete res.classes
        if (!('unions' in expected)) delete res.unions

        expect(res).eql(expected)
    }

    it('shows added constructors', () => {
        test(['test1 = Test;'], ['test1 = Test;', 'test2 = Test;'], {
            classes: {
                added: [
                    {
                        kind: 'class',
                        name: 'test2',
                        id: 3847402009,
                        type: 'Test',
                        arguments: [],
                    },
                ],
                removed: [],
                modified: [],
            },
        })
    })

    it('shows removed constructors', () => {
        test(['test1 = Test;', 'test2 = Test;'], ['test1 = Test;'], {
            classes: {
                removed: [
                    {
                        kind: 'class',
                        name: 'test2',
                        id: 3847402009,
                        type: 'Test',
                        arguments: [],
                    },
                ],
                added: [],
                modified: [],
            },
        })
    })

    it('shows modified constructors', () => {
        test(['test foo:int = Test;'], ['test foo:Foo = Test;'], {
            classes: {
                removed: [],
                added: [],
                modified: [
                    {
                        name: 'test',
                        arguments: {
                            added: [],
                            removed: [],
                            modified: [
                                {
                                    name: 'foo',
                                    type: {
                                        old: 'int',
                                        new: 'Foo',
                                    },
                                },
                            ],
                        },
                        id: {
                            new: 3348640942,
                            old: 1331975629,
                        },
                    },
                ],
            },
        })
    })

    it('shows removed unions', () => {
        test(
            ['test foo:int = Test;', 'test1 = Test1;'],
            ['test foo:Foo = Test;'],
            {
                unions: {
                    removed: [
                        {
                            name: 'Test1',
                            classes: [
                                {
                                    kind: 'class',
                                    name: 'test1',
                                    id: 3739166976,
                                    type: 'Test1',
                                    arguments: [],
                                },
                            ],
                        },
                    ],
                    added: [],
                    modified: [],
                },
            }
        )
    })

    it('shows added unions', () => {
        test(
            ['test foo:int = Test;'],
            ['test foo:Foo = Test;', 'test1 = Test1;'],
            {
                unions: {
                    added: [
                        {
                            name: 'Test1',
                            classes: [
                                {
                                    kind: 'class',
                                    name: 'test1',
                                    id: 3739166976,
                                    type: 'Test1',
                                    arguments: [],
                                },
                            ],
                        },
                    ],
                    removed: [],
                    modified: [],
                },
            }
        )
    })

    it('shows modified unions', () => {
        test(
            ['test foo:int = Test;', 'test1 = Test;'],
            ['test foo:Foo = Test;', 'test2 = Test;'],
            {
                unions: {
                    added: [],
                    removed: [],
                    modified: [
                        {
                            name: 'Test',
                            classes: {
                                added: [
                                    {
                                        kind: 'class',
                                        name: 'test2',
                                        id: 3847402009,
                                        type: 'Test',
                                        arguments: [],
                                    },
                                ],
                                removed: [
                                    {
                                        kind: 'class',
                                        name: 'test1',
                                        id: 1809692154,
                                        type: 'Test',
                                        arguments: [],
                                    },
                                ],
                                modified: [],
                            },
                            methods: {
                                added: [],
                                removed: [],
                                modified: [],
                            },
                        },
                    ],
                },
            }
        )

        test(
            ['test foo:int = Test;', 'test1 = Test;'],
            ['test2 foo:Foo = Test;', 'test3 = Test;'],
            {
                unions: {
                    added: [],
                    removed: [],
                    modified: [
                        {
                            name: 'Test',
                            classes: {
                                added: [
                                    {
                                        kind: 'class',
                                        name: 'test2',
                                        id: 711487159,
                                        type: 'Test',
                                        arguments: [
                                            {
                                                name: 'foo',
                                                type: 'Foo',
                                            },
                                        ],
                                    },
                                    {
                                        kind: 'class',
                                        name: 'test3',
                                        id: 704164487,
                                        type: 'Test',
                                        arguments: [],
                                    },
                                ],
                                removed: [
                                    {
                                        kind: 'class',
                                        name: 'test',
                                        id: 1331975629,
                                        type: 'Test',
                                        arguments: [
                                            {
                                                name: 'foo',
                                                type: 'int',
                                            },
                                        ],
                                    },
                                    {
                                        kind: 'class',
                                        name: 'test1',
                                        id: 1809692154,
                                        type: 'Test',
                                        arguments: [],
                                    },
                                ],
                                modified: [],
                            },
                            methods: {
                                added: [],
                                removed: [],
                                modified: [],
                            },
                        },
                    ],
                },
            }
        )

        test(
            ['test = Test;', 'test1 = Test;'],
            ['test = Test1;', 'test1 = Test1;'],
            {
                unions: {
                    added: [
                        {
                            name: 'Test1',
                            classes: [
                                {
                                    kind: 'class',
                                    name: 'test',
                                    id: 1997819349,
                                    type: 'Test1',
                                    arguments: [],
                                },
                                {
                                    kind: 'class',
                                    name: 'test1',
                                    id: 3739166976,
                                    type: 'Test1',
                                    arguments: [],
                                },
                            ],
                        },
                    ],
                    removed: [
                        {
                            name: 'Test',
                            classes: [
                                {
                                    kind: 'class',
                                    name: 'test',
                                    id: 471282454,
                                    type: 'Test',
                                    arguments: [],
                                },
                                {
                                    kind: 'class',
                                    name: 'test1',
                                    id: 1809692154,
                                    type: 'Test',
                                    arguments: [],
                                },
                            ],
                        },
                    ],
                    modified: [],
                },
            }
        )
    })
})
