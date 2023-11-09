import { describe, expect, it } from 'vitest'

import { parseTlToEntries } from '../parse.js'
import { generateWriterCodeForTlEntries, generateWriterCodeForTlEntry } from './writer.js'

describe('generateWriterCodeForTlEntry', () => {
    const test = (...tl: string[]) => {
        const entry = parseTlToEntries(tl.join('\n')).slice(-1)[0]
        expect(generateWriterCodeForTlEntry(entry)).toMatchSnapshot()
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

    it('generates code for constructors with multiple flags fields', () => {
        test(
            'updates.channelDifferenceEmpty#3e11affb flags:# final:flags.0?true pts:int timeout:flags.1?int flags2:# can_delete_channel:flags2.0?true = updates.ChannelDifference;',
        )
    })

    it('generates code for constructors with multiple fields using the same flag', () => {
        test(
            'inputMediaPoll#f94e5f1 flags:# solution:flags.1?string solution_entities:flags.1?Vector<MessageEntity> = InputMedia;',
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

    it('generates code for bare vectors', () => {
        test('message#0949d9dc = Message;\n' + 'msg_container#73f1f8dc messages:vector<%Message> = MessageContainer;')
        test(
            'future_salt#0949d9dc = FutureSalt;',
            'future_salts#ae500895 salts:Vector<future_salt> current:FutureSalt = FutureSalts;',
        )
    })

    it('generates code with raw flags for constructors with flags', () => {
        const entry = parseTlToEntries('test flags:# flags2:# = Test;')[0]
        expect(generateWriterCodeForTlEntry(entry, { includeFlags: true })).toMatchSnapshot()
    })

    it('automatically computes constructor ID if needed', () => {
        const entry = parseTlToEntries('topPeerCategoryBotsPM#ab661b5b = TopPeerCategory;')[0]
        entry.id = 0

        expect(generateWriterCodeForTlEntry(entry)).toMatchSnapshot()
    })

    it('throws for invalid bit index', () => {
        const entry = parseTlToEntries('test flags:# field:flags.33?true = Test;')[0]
        expect(() => generateWriterCodeForTlEntry(entry, { includeFlags: true })).toThrow()
    })
})

describe('generateWriterCodeForTlEntries', () => {
    it('generates code for bare types', () => {
        const entries = parseTlToEntries(
            'future_salt#0949d9dc salt:bytes = FutureSalt;\n' +
                'future_salts#ae500895 salts:vector<future_salt> current:future_salt = FutureSalts;',
        )

        expect(generateWriterCodeForTlEntries(entries, { includePrelude: false })).toMatchSnapshot()
    })

    it('throws when a bare type is not available', () => {
        const entries = parseTlToEntries(
            'future_salts#ae500895 salts:vector<future_salt> current:FutureSalt = FutureSalts;',
        )
        entries[0].arguments[1].typeModifiers = { isBareUnion: true }

        expect(() => generateWriterCodeForTlEntries(entries, { includePrelude: false })).toThrow()
    })

    it('should include prelude by default', () => {
        expect(generateWriterCodeForTlEntries([])).toMatchSnapshot()
    })

    it('should include static sizes calculations', () => {
        const entries = parseTlToEntries(
            'test1 foo:int bar:int = Test;\n' +
                'test2 foo:int bar:double = Test;\n' +
                'test3 foo:int bar:bytes = Test;\n', // should not be included
        )
        const code = generateWriterCodeForTlEntries(entries, { includeStaticSizes: true })

        expect(code).toMatchSnapshot()
    })
})
