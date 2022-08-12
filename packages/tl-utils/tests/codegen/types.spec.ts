import { describe, it } from 'mocha'
import { expect } from 'chai'

import { parseTlToEntries } from '../../src/parse'
import {
    generateTypescriptDefinitionsForTlEntry,
    generateTypescriptDefinitionsForTlSchema,
} from '../../src/codegen/types'
import { parseFullTlSchema } from '../../src/schema'

describe('generateTypescriptDefinitionsForTlEntry', () => {
    const test = (tl: string, ...ts: string[]) => {
        const entry = parseTlToEntries(tl)[0]
        expect(generateTypescriptDefinitionsForTlEntry(entry)).eq(ts.join('\n'))
    }

    it('replaces primitive types', () => {
        test(
            'test a:int b:long c:double d:string e:bytes f:Bool g:vector<int> = Test;',
            'interface RawTest {',
            "    _: 'test';",
            '    a: number;',
            '    b: Long;',
            '    c: Double;',
            '    d: string;',
            '    e: Buffer;',
            '    f: boolean;',
            '    g: number[];',
            '}'
        )
    })

    it('ignores namespace for name', () => {
        test(
            'test.test = Test;',
            'interface RawTest {',
            "    _: 'test.test';",
            '}'
        )
    })

    it('renames non-primitive types', () => {
        test(
            'test foo:Foo bar:vector<Bar> baz:namespace.Baz egg:vector<namespace.Egg> = Test;',
            'interface RawTest {',
            "    _: 'test';",
            '    foo: tl.TypeFoo;',
            '    bar: tl.TypeBar[];',
            '    baz: tl.namespace.TypeBaz;',
            '    egg: tl.namespace.TypeEgg[];',
            '}'
        )
    })

    it('marks optional fields as optional', () => {
        test(
            'test flags:# a:flags.0?true b:flags.1?string c:flags.2?Foo d:flags.3?vector<namespace.Foo> = Test;',
            'interface RawTest {',
            "    _: 'test';",
            '    a?: boolean;',
            '    b?: string;',
            '    c?: tl.TypeFoo;',
            '    d?: tl.namespace.TypeFoo[];',
            '}'
        )
    })

    describe('comments', () => {
        it('adds tl style comments', () => {
            test(
                '// This is a test constructor\n' + 'test = Test;',
                '/**',
                ' * This is a test constructor',
                ' */',
                'interface RawTest {',
                "    _: 'test';",
                '}'
            )
            test(
                '---functions---\n' +
                    '// This is a test method\n' +
                    'test = Test;',
                '/**',
                ' * This is a test method',
                ' * ',
                ' * RPC method returns {@link tl.TypeTest}',
                ' */',
                'interface RawTestRequest {',
                "    _: 'test';",
                '}'
            )
        })

        it('adds tdlib style comments', () => {
            test(
                '// @description This is a test constructor\n' +
                    '// @field Some field\n' +
                    'test field:int = Test;',
                '/**',
                ' * This is a test constructor',
                ' */',
                'interface RawTest {',
                "    _: 'test';",
                '    /**',
                '     * Some field',
                '     */',
                '    field: number;',
                '}'
            )
        })

        it('wraps long comments', () => {
            test(
                '// This is a test constructor with a very very very very very very very very long comment\n' +
                'test = Test;',
                '/**',
                ' * This is a test constructor with a very very very very very',
                ' * very very very long comment',
                ' */',
                'interface RawTest {',
                "    _: 'test';",
                '}'
            )

            test(
                '---functions---\n' +
                '// This is a test method with a very very very very very very very very long comment\n' +
                'test = Test;',
                '/**',
                ' * This is a test method with a very very very very very very',
                ' * very very long comment',
                ' * ',
                ' * RPC method returns {@link tl.TypeTest}',
                ' */',
                'interface RawTestRequest {',
                "    _: 'test';",
                '}'
            )
        })

        it('should not break @link tags', () => {
            test(
                '// This is a test constructor with a very long comment {@link whatever} more text\n' +
                'test = Test;',
                '/**',
                ' * This is a test constructor with a very long comment',
                ' * {@link whatever} more text',
                ' */',
                'interface RawTest {',
                "    _: 'test';",
                '}'
            )
        })
    })

    it('writes generic types', () => {
        test(
            '---functions---\ninvokeWithoutUpdates#bf9459b7 {X:Type} query:!X = X;',
            'interface RawInvokeWithoutUpdatesRequest<X extends tl.TlObject> {',
            "    _: 'invokeWithoutUpdates';",
            '    query: X;',
            '}'
        )
    })

    it('generates code with raw flags for constructors with flags', () => {
        const entry = parseTlToEntries('test flags:# flags2:# = Test;')[0]
        expect(
            generateTypescriptDefinitionsForTlEntry(
                entry,
                undefined,
                undefined,
                true
            )
        ).eq(
            [
                'interface RawTest {',
                "    _: 'test';",
                '    flags: number;',
                '    flags2: number;',
                '}',
            ].join('\n')
        )
    })
})

describe('generateTypescriptDefinitionsForTlSchema', () => {
    const test = (tl: string, ts: string[], js: string[]) => {
        const entries = parseTlToEntries(tl)
        const schema = parseFullTlSchema(entries)

        let [codeTs, codeJs] = generateTypescriptDefinitionsForTlSchema(
            schema,
            0
        )

        // skip prelude
        codeTs = codeTs.substring(
            codeTs.indexOf('-readonly [P in keyof T]: T[P]') + 37,
            codeTs.length - 1
        )
        // unindent first level
        codeTs = codeTs.replace(/^ {4}/gm, '')

        // skip prelude
        codeJs = codeJs.substring(
            codeJs.indexOf('ns.LAYER = 0;') + 14,
            codeJs.length - 15
        )

        expect(codeTs.trim()).eq(ts.join('\n'))
        expect(codeJs.trim()).eq(js.join('\n'))
    }

    it('writes simple schemas', () => {
        test(
            'test = Test;',
            [
                'interface RawTest {',
                "    _: 'test';",
                '}',
                'interface RpcCallReturn {',
                '}',
                'type TypeTest = tl.RawTest',
                'function isAnyTest(o: object): o is TypeTest',
                '',
                'type TlObject =',
                '    | tl.RawTest',
            ],
            [
                "ns.isAnyTest = _isAny('Test');",
                '_types = JSON.parse(\'{"test":"Test"}\');',
            ]
        )
    })

    it('writes schemas with multi-unions', () => {
        test(
            'test = Test;\ntest2 = Test;',
            [
                'interface RawTest {',
                "    _: 'test';",
                '}',
                'interface RawTest2 {',
                "    _: 'test2';",
                '}',
                'interface RpcCallReturn {',
                '}',
                'type TypeTest = tl.RawTest | tl.RawTest2',
                'function isAnyTest(o: object): o is TypeTest',
                '',
                'type TlObject =',
                '    | tl.RawTest',
                '    | tl.RawTest2',
            ],
            [
                "ns.isAnyTest = _isAny('Test');",
                '_types = JSON.parse(\'{"test":"Test","test2":"Test"}\');',
            ]
        )
    })

    it('writes schemas with methods', () => {
        test(
            'test = Test;\n---functions---\ngetTest = Test;',
            [
                'interface RawTest {',
                "    _: 'test';",
                '}',
                '/**',
                ' * RPC method returns {@link tl.TypeTest}',
                ' */',
                'interface RawGetTestRequest {',
                "    _: 'getTest';",
                '}',
                'interface RpcCallReturn {',
                "    'getTest': tl.TypeTest",
                '}',
                'type TypeTest = tl.RawTest',
                'function isAnyTest(o: object): o is TypeTest',
                'type RpcMethod =',
                '    | tl.RawGetTestRequest',
                '',
                'type TlObject =',
                '    | tl.RawTest',
                '    | tl.RawGetTestRequest',
            ],
            [
                "ns.isAnyTest = _isAny('Test');",
                '_types = JSON.parse(\'{"test":"Test"}\');',
            ]
        )
    })

    it('writes schemas with namespaces', () => {
        test(
            'test = Test;\n' +
                'test2 = Test;\n' +
                'test.test = test.Test;\n' +
                'test.test2 = test.Test;\n' +
                '---functions---\n' +
                'getTest = Test;\n' +
                'test.getTest = test.Test;',
            [
                `
interface RawTest {
    _: 'test';
}
interface RawTest2 {
    _: 'test2';
}
/**
 * RPC method returns {@link tl.TypeTest}
 */
interface RawGetTestRequest {
    _: 'getTest';
}
interface RpcCallReturn extends test.RpcCallReturn {
    'getTest': tl.TypeTest
}
type TypeTest = tl.RawTest | tl.RawTest2
function isAnyTest(o: object): o is TypeTest

namespace test {
    interface RawTest {
        _: 'test.test';
    }
    interface RawTest2 {
        _: 'test.test2';
    }
    /**
     * RPC method returns {@link tl.test.TypeTest}
     */
    interface RawGetTestRequest {
        _: 'test.getTest';
    }
    interface RpcCallReturn {
        'test.getTest': tl.test.TypeTest
    }
    type TypeTest = tl.test.RawTest | tl.test.RawTest2
    function isAnyTest(o: object): o is TypeTest
}
type RpcMethod =
    | tl.RawGetTestRequest
    | tl.test.RawGetTestRequest

type TlObject =
    | tl.RawTest
    | tl.RawTest2
    | tl.test.RawTest
    | tl.test.RawTest2
    | tl.RawGetTestRequest
    | tl.test.RawGetTestRequest
`.trim(),
            ],
            [
                `
ns.isAnyTest = _isAny('Test');
ns.test = {};
(function(ns){
ns.isAnyTest = _isAny('test.Test');
})(ns.test);
_types = JSON.parse('{"test":"Test","test2":"Test","test.test":"test.Test","test.test2":"test.Test"}');
`.trim(),
            ]
        )
    })
})
