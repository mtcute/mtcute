import { describe, expect, it } from 'vitest'

import { parseTlToEntries } from '../parse.js'
import { generateReaderCodeForTlEntries, generateReaderCodeForTlEntry } from './reader.js'

describe('generateReaderCodeForTlEntry', () => {
    const test = (...tl: string[]) => {
        const entry = parseTlToEntries(tl.join('\n')).slice(-1)[0]
        expect(generateReaderCodeForTlEntry(entry)).toMatchSnapshot()
    }

    it('generates code for constructors without arguments', () => {
        test('topPeerCategoryBotsPM#ab661b5b = TopPeerCategory;')
    })

    it('generates code for constructors with simple arguments', () => {
        test('inputBotInlineMessageID#890c3d89 dc_id:int id:long access_hash:long = InputBotInlineMessageID;')
        test('contact#145ade0b user_id:long mutual:Bool = Contact;')
        test('maskCoords#aed6dbb2 n:int x:double y:double zoom:double = MaskCoords;')
    })

    it('generates code for constructors with true flags', () => {
        test('messages.messageEditData#26b5dde6 flags:# caption:flags.0?true = messages.MessageEditData;')
    })

    it('generates code for constructors with optional arguments', () => {
        test(
            'updates.channelDifferenceEmpty#3e11affb flags:# final:flags.0?true pts:int timeout:flags.1?int = updates.ChannelDifference;',
        )
    })

    it('generates code for constructors with arguments before flags field', () => {
        test('poll#86e18161 id:long flags:# quiz:flags.3?true question:string = Poll;')
    })

    it('generates code for constructors with multiple flags fields', () => {
        test(
            'updates.channelDifferenceEmpty#3e11affb flags:# final:flags.0?true pts:int timeout:flags.1?int flags2:# can_delete_channel:flags2.0?true = updates.ChannelDifference;',
        )
    })

    it('generates code for constructors with vector arguments', () => {
        test('contacts.resolvedPeer#7f077ad9 peer:Peer chats:Vector<Chat> users:Vector<User> = contacts.ResolvedPeer;')
    })

    it('generates code for constructors with optional vector arguments', () => {
        test(
            'messages.getWebPagePreview#8b68b0cc flags:# message:string entities:flags.3?Vector<MessageEntity> = MessageMedia;',
        )
    })

    it('generates code for constructors with generics', () => {
        test('invokeWithLayer#da9b0d0d {X:Type} layer:int query:!X = X;')
    })

    it('generates code for bare types', () => {
        test('message#0949d9dc = Message;', 'msg_container#73f1f8dc messages:vector<%Message> = MessageContainer;')
        test(
            'future_salt#0949d9dc = FutureSalt;',
            'future_salts#ae500895 salts:Vector<future_salt> current:FutureSalt = FutureSalts;',
        )
        test(
            'future_salt#0949d9dc = FutureSalt;\n',
            'future_salts#ae500895 salts:vector<future_salt> current:future_salt = FutureSalts;',
        )
    })

    it('generates code with raw flags for constructors with flags', () => {
        const entry = parseTlToEntries('test flags:# flags2:# = Test;')[0]
        expect(generateReaderCodeForTlEntry(entry, { includeFlags: true })).toMatchSnapshot()
    })
})

describe('generateReaderCodeForTlEntries', () => {
    it('generates code for multiple entries', () => {
        const entries = parseTlToEntries('test = Test;\ntest2 = Test2;\n')

        expect(generateReaderCodeForTlEntries(entries)).toMatchSnapshot()
    })

    it("doesn't generate code for methods by default", () => {
        const entries = parseTlToEntries(['test = Test;', '---functions---', 'test2 = Test2;'].join('\n'))

        expect(generateReaderCodeForTlEntries(entries)).toMatchSnapshot()
    })

    it('generates code for methods if asked to', () => {
        const entries = parseTlToEntries(['test = Test;', '---functions---', 'test2 = Test2;'].join('\n'))

        expect(generateReaderCodeForTlEntries(entries, { includeMethods: true })).toMatchSnapshot()
    })

    it('updates readers used in bare vectors', () => {
        const entries = parseTlToEntries(['test = Test;', 'test2 a:vector<test> = Test2;'].join('\n'))

        expect(generateReaderCodeForTlEntries(entries)).toMatchSnapshot()
    })

    describe('method return readers', () => {
        it('includes primitive return type parsing info', () => {
            const entries = parseTlToEntries(['test1 = Test;', '---functions---', 'test = int;'].join('\n'))

            expect(generateReaderCodeForTlEntries(entries, { includeMethodResults: true })).toMatchSnapshot()
        })

        it('includes primitive vectors return type parsing info', () => {
            const entries = parseTlToEntries(['---functions---', 'test = Vector<int>;'].join('\n'), {
                parseMethodTypes: true,
            })

            expect(generateReaderCodeForTlEntries(entries, { includeMethodResults: true })).toMatchSnapshot()
        })

        it('includes primitive vectors return type parsing info', () => {
            const entries = parseTlToEntries(['---functions---', 'test = Vector<int>;'].join('\n'), {
                parseMethodTypes: true,
            })

            expect(generateReaderCodeForTlEntries(entries, { includeMethodResults: true })).toMatchSnapshot()
        })

        it("doesn't include Bool parsing", () => {
            const entries = parseTlToEntries(['---functions---', 'test = Bool;'].join('\n'), {
                parseMethodTypes: true,
            })

            expect(generateReaderCodeForTlEntries(entries, { includeMethodResults: true })).toMatchSnapshot()
        })
    })
})
