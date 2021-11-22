import { describe, it } from 'mocha'
import { expect } from 'chai'
import { TlEntry } from '../src/types'
import { parseTlToEntries } from '../src/parse'

describe('tl parser', () => {
    const test = (tl: string, expected: TlEntry[]) => {
        expect(parseTlToEntries(tl)).eql(expected)
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
            []
        )
    })

    it('parses classes w/out arguments', () => {
        test('inputUserSelf#f7c1b13f = InputUser;', [
            {
                kind: 'class',
                name: 'inputUserSelf',
                id: 0xf7c1b13f,
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
                id: 0xf21158c6,
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

    it('parses methods with arguments', () => {
        test(
            '---functions---\nauth.exportAuthorization#e5bfffcd dc_id:int = auth.ExportedAuthorization;',
            [
                {
                    kind: 'method',
                    name: 'auth.exportAuthorization',
                    id: 0xe5bfffcd,
                    type: 'auth.ExportedAuthorization',
                    arguments: [
                        {
                            name: 'dc_id',
                            type: 'int',
                        },
                    ],
                },
            ]
        )
    })

    it('parses multiple classes', () => {
        test(
            'jsonNull#3f6d7b68 = JSONValue;\njsonBool#c7345e6a value:Bool = JSONValue;',
            [
                {
                    kind: 'class',
                    name: 'jsonNull',
                    id: 0x3f6d7b68,
                    type: 'JSONValue',
                    arguments: [],
                },
                {
                    kind: 'class',
                    name: 'jsonBool',
                    id: 0xc7345e6a,
                    type: 'JSONValue',
                    arguments: [
                        {
                            name: 'value',
                            type: 'Bool',
                        },
                    ],
                },
            ]
        )
    })

    it('parses generics', () => {
        test(
            '---functions---\ninvokeWithLayer#da9b0d0d {X:Type} layer:int query:!X = X;',
            [
                {
                    kind: 'method',
                    name: 'invokeWithLayer',
                    id: 0xda9b0d0d,
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
            ]
        )
    })

    it('parses predicates', () => {
        test(
            'help.promoData#8c39793f flags:# proxy:flags.0?true expires:int peer:Peer chats:Vector<Chat> users:Vector<User> psa_type:flags.1?string psa_message:flags.2?string = help.PromoData;',
            [
                {
                    kind: 'class',
                    name: 'help.promoData',
                    id: 0x8c39793f,
                    type: 'help.PromoData',
                    arguments: [
                        {
                            name: 'flags',
                            type: '#',
                        },
                        {
                            name: 'proxy',
                            type: 'true',
                            predicate: 'flags.0',
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
                            name: 'chats',
                            type: 'Vector<Chat>',
                        },
                        {
                            name: 'users',
                            type: 'Vector<User>',
                        },
                        {
                            name: 'psa_type',
                            type: 'string',
                            predicate: 'flags.1',
                        },
                        {
                            name: 'psa_message',
                            type: 'string',
                            predicate: 'flags.2',
                        },
                    ],
                },
            ]
        )
    })

    it('generates constructor id if missing', () => {
        const items = parseTlToEntries(
            `
invokeWithLayer {X:Type} layer:int query:!X = X;
help.promoData flags:# proxy:flags.0?true expires:int peer:Peer chats:Vector<Chat> users:Vector<User> psa_type:flags.1?string psa_message:flags.2?string = help.PromoData;
account.getAccountTTL = AccountDaysTTL;
users.getUsers id:Vector<InputUser> = Vector<User>;
`
        )
        expect(items[0].id).eq(0xda9b0d0d)
        expect(items[1].id).eq(0x8c39793f)
        expect(items[2].id).eq(0x8fc711d)
        expect(items[3].id).eq(0xd91a548)
    })

    it('parses preceding comments', () => {
        test('// Self input user\ninputUserSelf#f7c1b13f = InputUser;', [
            {
                kind: 'class',
                name: 'inputUserSelf',
                id: 0xf7c1b13f,
                type: 'InputUser',
                arguments: [],
                comment: 'Self input user',
            },
        ])

        test('// Self input user\n//yes\ninputUserSelf#f7c1b13f = InputUser;', [
            {
                kind: 'class',
                name: 'inputUserSelf',
                id: 0xf7c1b13f,
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
                id: 0xf7c1b13f,
                type: 'InputUser',
                arguments: [],
            },
        ])
    })

    it('parses tdlib-style comments', () => {
        test(
            '//@description A file defined by its remote ID. The remote ID is guaranteed to be usable ' +
                'only if the corresponding file is still accessible to the user and known to TDLib.\n' +
                '//-For example, if the file is from a message, then the message must be not deleted and ' +
                'accessible to the user. If the file database is disabled, then the corresponding object ' +
                'with the file must be preloaded by the application\n' +
                '//@id Remote file identifier\n' +
                'inputFileRemote id:string = InputFile;\n',
            [
                {
                    kind: 'class',
                    name: 'inputFileRemote',
                    id: 0xf9968b3e,
                    type: 'InputFile',
                    arguments: [
                        {
                            name: 'id',
                            type: 'string',
                            comment: 'Remote file identifier',
                        },
                    ],
                    comment:
                        'A file defined by its remote ID. The remote ID is guaranteed to be usable ' +
                        'only if the corresponding file is still accessible to the user and known to TDLib.\n' +
                        'For example, if the file is from a message, then the message must be not deleted and ' +
                        'accessible to the user. If the file database is disabled, then the corresponding object ' +
                        'with the file must be preloaded by the application',
                },
            ]
        )
    })

    it('calls callback on orphan comment', () => {
        const orphaned: string[] = []
        parseTlToEntries(
            '// some comment idk\n\n' +
                '//another comment\n' +
                '//but multiline\n\n' +
                '//yet another at the end',
            {
                onOrphanComment: (s) => orphaned.push(s)
            }
        )

        expect(orphaned).eql([
            'some comment idk',
            'another comment but multiline',
            'yet another at the end'
        ])
    })
})
