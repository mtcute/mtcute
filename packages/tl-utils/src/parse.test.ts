import type { TlEntry } from './types.js'

import { describe, expect, it, vi } from 'vitest'
import { parseTlToEntries } from './parse.js'

describe('tl parser', () => {
    const test = (tl: string, expected: TlEntry[], params?: Parameters<typeof parseTlToEntries>[1]) => {
        expect(parseTlToEntries(tl, params)).toEqual(expected)
    }

    it('skips empty lines and comments', () => {
        test('// this is a comment', [])
        test('// this is a comment\n\n\n\n// another comment', [])
    })

    it('skips primitives declarations', () => {
        test(
            `
int ? = Int;
long ? = Long;
double ? = Double;
string ? = String;
bytes = Bytes;

vector {t:Type} # [ t ] = Vector t;

int128 4*[ int ] = Int128;
int256 8*[ int ] = Int256;

true#3fedd339 = True;
boolFalse#bc799737 = Bool;
boolTrue#997275b5 = Bool;
`,
            [],
        )
    })

    it('parses classes w/out arguments', () => {
        test('inputUserSelf#f7c1b13f = InputUser;', [
            {
                kind: 'class',
                name: 'inputUserSelf',
                id: 0xF7C1B13F,
                type: 'InputUser',
                arguments: [],
            },
        ])
    })

    it('parses classes with arguments', () => {
        test('inputUser#f21158c6 user_id:long access_hash:long = InputUser;', [
            {
                kind: 'class',
                name: 'inputUser',
                id: 0xF21158C6,
                type: 'InputUser',
                arguments: [
                    {
                        name: 'user_id',
                        type: 'long',
                    },
                    {
                        name: 'access_hash',
                        type: 'long',
                    },
                ],
            },
        ])
    })

    it('parses vectors', () => {
        test('msg_resend_req#7d861a08 msg_ids:Vector<long> = MsgResendReq;', [
            {
                kind: 'class',
                name: 'msg_resend_req',
                id: 0x7D861A08,
                type: 'MsgResendReq',
                arguments: [
                    {
                        name: 'msg_ids',
                        type: 'long',
                        typeModifiers: {
                            isVector: true,
                        },
                    },
                ],
            },
        ])
    })

    it('parses bare vectors', () => {
        // note: not from schema, schema uses bare `future_salt` instead
        test('future_salts#ae500895 req_msg_id:long now:int salts:vector<FutureSalt> = FutureSalts;', [
            {
                kind: 'class',
                name: 'future_salts',
                id: 0xAE500895,
                type: 'FutureSalts',
                arguments: [
                    {
                        name: 'req_msg_id',
                        type: 'long',
                    },
                    {
                        name: 'now',
                        type: 'int',
                    },
                    {
                        name: 'salts',
                        type: 'FutureSalt',
                        typeModifiers: {
                            isBareVector: true,
                        },
                    },
                ],
            },
        ])
    })

    it('parses bare unions', () => {
        test(
            'message#0949d9dc = Message;\n' // stub so we can reference it
            + 'msg_container#73f1f8dc messages:vector<%Message> = MessageContainer;',
            [
                {
                    kind: 'class',
                    name: 'message',
                    id: 0x0949D9DC,
                    type: 'Message',
                    arguments: [],
                },
                {
                    kind: 'class',
                    name: 'msg_container',
                    id: 0x73F1F8DC,
                    type: 'MessageContainer',
                    arguments: [
                        {
                            name: 'messages',
                            type: 'Message',
                            typeModifiers: {
                                isBareVector: true,
                                isBareUnion: true,
                                constructorId: 0x0949D9DC,
                            },
                        },
                    ],
                },
            ],
        )
    })

    it('parses bare types', () => {
        test(
            'future_salt#0949d9dc = FutureSalt;\n' // stub so we can reference it
            + 'future_salts#ae500895 req_msg_id:long now:int salts:vector<future_salt> = FutureSalts;',
            [
                {
                    kind: 'class',
                    name: 'future_salt',
                    id: 0x0949D9DC,
                    type: 'FutureSalt',
                    arguments: [],
                },
                {
                    kind: 'class',
                    name: 'future_salts',
                    id: 0xAE500895,
                    type: 'FutureSalts',
                    arguments: [
                        {
                            name: 'req_msg_id',
                            type: 'long',
                        },
                        {
                            name: 'now',
                            type: 'int',
                        },
                        {
                            name: 'salts',
                            type: 'future_salt',
                            typeModifiers: {
                                isBareVector: true,
                                isBareType: true,
                                constructorId: 0x0949D9DC,
                            },
                        },
                    ],
                },
            ],
        )
    })

    it('parses methods with arguments', () => {
        test('---functions---\nauth.exportAuthorization#e5bfffcd dc_id:int = auth.ExportedAuthorization;', [
            {
                kind: 'method',
                name: 'auth.exportAuthorization',
                id: 0xE5BFFFCD,
                type: 'auth.ExportedAuthorization',
                arguments: [
                    {
                        name: 'dc_id',
                        type: 'int',
                    },
                ],
            },
        ])
    })

    it('parses multiple classes', () => {
        test('jsonNull#3f6d7b68 = JSONValue;\njsonBool#c7345e6a value:Bool = JSONValue;', [
            {
                kind: 'class',
                name: 'jsonNull',
                id: 0x3F6D7B68,
                type: 'JSONValue',
                arguments: [],
            },
            {
                kind: 'class',
                name: 'jsonBool',
                id: 0xC7345E6A,
                type: 'JSONValue',
                arguments: [
                    {
                        name: 'value',
                        type: 'Bool',
                    },
                ],
            },
        ])
    })

    it('parses generics', () => {
        test('---functions---\ninvokeWithLayer#da9b0d0d {X:Type} layer:int query:!X = X;', [
            {
                kind: 'method',
                name: 'invokeWithLayer',
                id: 0xDA9B0D0D,
                type: 'X',
                generics: [
                    {
                        name: 'X',
                        type: 'Type',
                    },
                ],
                arguments: [
                    {
                        name: 'layer',
                        type: 'int',
                    },
                    {
                        name: 'query',
                        type: '!X',
                    },
                ],
            },
        ])
    })

    it('parses predicates', () => {
        test(
            'help.promoData#8c39793f flags:# proxy:flags.0?true expires:int peer:Peer psa_type:flags.1?string psa_message:flags.2?string = help.PromoData;',
            [
                {
                    kind: 'class',
                    name: 'help.promoData',
                    id: 0x8C39793F,
                    type: 'help.PromoData',
                    arguments: [
                        {
                            name: 'flags',
                            type: '#',
                        },
                        {
                            name: 'proxy',
                            type: 'true',
                            typeModifiers: {
                                predicate: 'flags.0',
                            },
                        },
                        {
                            name: 'expires',
                            type: 'int',
                        },
                        {
                            name: 'peer',
                            type: 'Peer',
                        },
                        {
                            name: 'psa_type',
                            type: 'string',
                            typeModifiers: {
                                predicate: 'flags.1',
                            },
                        },
                        {
                            name: 'psa_message',
                            type: 'string',
                            typeModifiers: {
                                predicate: 'flags.2',
                            },
                        },
                    ],
                },
            ],
        )
    })

    it('generates constructor id if missing', () => {
        const items = parseTlToEntries(
            `
invokeWithLayer {X:Type} layer:int query:!X = X;
help.promoData flags:# proxy:flags.0?true expires:int peer:Peer chats:Vector<Chat> users:Vector<User> psa_type:flags.1?string psa_message:flags.2?string = help.PromoData;
account.getAccountTTL = AccountDaysTTL;
users.getUsers id:Vector<InputUser> = Vector<User>;
`,
        )
        expect(items[0].id).toEqual(0xDA9B0D0D)
        expect(items[1].id).toEqual(0x8C39793F)
        expect(items[2].id).toEqual(0x8FC711D)
        expect(items[3].id).toEqual(0xD91A548)
    })

    it('parses preceding comments', () => {
        test('// Self input user\ninputUserSelf#f7c1b13f = InputUser;', [
            {
                kind: 'class',
                name: 'inputUserSelf',
                id: 0xF7C1B13F,
                type: 'InputUser',
                arguments: [],
                comment: 'Self input user',
            },
        ])

        test('// Self input user\n//yes\ninputUserSelf#f7c1b13f = InputUser;', [
            {
                kind: 'class',
                name: 'inputUserSelf',
                id: 0xF7C1B13F,
                type: 'InputUser',
                arguments: [],
                comment: 'Self input user yes',
            },
        ])
    })

    it('ignores comments with an empty line', () => {
        test('// Self input user\n\ninputUserSelf#f7c1b13f = InputUser;', [
            {
                kind: 'class',
                name: 'inputUserSelf',
                id: 0xF7C1B13F,
                type: 'InputUser',
                arguments: [],
            },
        ])
    })

    it('parses tdlib-style comments', () => {
        test(
            '//@description A file defined by its remote ID. The remote ID is guaranteed to be usable '
            + 'only if the corresponding file is still accessible to the user and known to TDLib.\n'
            + '//-For example, if the file is from a message, then the message must be not deleted and '
            + 'accessible to the user. If the file database is disabled, then the corresponding object '
            + 'with the file must be preloaded by the application\n'
            + '//@id Remote file identifier\n'
            + 'inputFileRemote id:string = InputFile;\n',
            [
                {
                    kind: 'class',
                    name: 'inputFileRemote',
                    id: 0xF9968B3E,
                    type: 'InputFile',
                    arguments: [
                        {
                            name: 'id',
                            type: 'string',
                            comment: 'Remote file identifier',
                        },
                    ],
                    comment:
                        'A file defined by its remote ID. The remote ID is guaranteed to be usable '
                        + 'only if the corresponding file is still accessible to the user and known to TDLib.\n'
                        + 'For example, if the file is from a message, then the message must be not deleted and '
                        + 'accessible to the user. If the file database is disabled, then the corresponding object '
                        + 'with the file must be preloaded by the application',
                },
            ],
        )
    })

    it('calls callback on orphan comment', () => {
        const orphaned: string[] = []
        parseTlToEntries(
            '// some comment idk\n\n' + '//another comment\n' + '//but multiline\n\n' + '//yet another at the end',
            {
                onOrphanComment: s => orphaned.push(s),
            },
        )

        expect(orphaned).toEqual(['some comment idk', 'another comment but multiline', 'yet another at the end'])
    })

    it('applies prefix to constructors', () => {
        test(
            'future_salt#0949d9dc = FutureSalt;\n' // stub to reference
            + 'future_salts#ae500895 salts:vector<future_salt> current:FutureSalt = FutureSalts;',
            [
                {
                    kind: 'class',
                    name: 'mt_future_salt',
                    id: 0x0949D9DC,
                    type: 'FutureSalt',
                    arguments: [],
                },
                {
                    kind: 'class',
                    name: 'mt_future_salts',
                    id: 0xAE500895,
                    type: 'FutureSalts',
                    arguments: [
                        {
                            name: 'salts',
                            type: 'mt_future_salt',
                            typeModifiers: {
                                isBareVector: true,
                                isBareType: true,
                                constructorId: 0x0949D9DC,
                            },
                        },
                        {
                            name: 'current',
                            type: 'FutureSalt', // prefix is not applied to non-constructors
                        },
                    ],
                },
            ],
            { prefix: 'mt_' },
        )
    })

    it('correctly handles ---types---', () => {
        test('---functions---\n' + 'testFn = Test;\n' + '---types---\n' + 'testType = Test;', [
            {
                arguments: [],
                id: 3671236185,
                kind: 'method',
                name: 'testFn',
                type: 'Test',
            },
            {
                arguments: [],
                id: 922588822,
                kind: 'class',
                name: 'testType',
                type: 'Test',
            },
        ])
    })

    describe('errors', () => {
        it('correctly throws errors if panicOnError is set', () => {
            const invalidSchema = 'some invalid schema 🥴'

            expect(() => parseTlToEntries(invalidSchema, { panicOnError: true })).toThrow(invalidSchema)
        })

        it('gracefully continues if onError set', () => {
            const schema = 'some invalid line 🥴\ntest = Test;'
            const onError = vi.fn()

            const res = parseTlToEntries(schema, { onError })

            expect(res).toEqual([
                {
                    arguments: [],
                    id: 471282454,
                    kind: 'class',
                    name: 'test',
                    type: 'Test',
                },
            ])
            expect(onError).toHaveBeenCalledOnce()
        })

        it('correctly handles incorrect %Foo usage', () => {
            expect(() => parseTlToEntries('test foo:%Foo = Test;', { panicOnError: true })).toThrow('not found')
            expect(() =>
                parseTlToEntries('foo = Foo;\nbar = Foo;\ntest foo:%Foo = Test;', { panicOnError: true }),
            ).toThrow('more than one')
        })
    })
})
