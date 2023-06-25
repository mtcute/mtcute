import { expect } from 'chai'
import { describe, it } from 'mocha'

import { generateReaderCodeForTlEntry, parseTlToEntries } from '../../src'

describe('generateReaderCodeForTlEntry', () => {
    const test = (tl: string, ...js: string[]) => {
        const entry = parseTlToEntries(tl).slice(-1)[0]
        expect(generateReaderCodeForTlEntry(entry)).eq(
            `${entry.id}:function(r){${js.join('')}},`,
        )
    }

    it('generates code for constructors without arguments', () => {
        test(
            'topPeerCategoryBotsPM#ab661b5b = TopPeerCategory;',
            "return{_:'topPeerCategoryBotsPM'}",
        )
    })

    it('generates code for constructors with simple arguments', () => {
        test(
            'inputBotInlineMessageID#890c3d89 dc_id:int id:long access_hash:long = InputBotInlineMessageID;',
            'return{',
            "_:'inputBotInlineMessageID',",
            'dcId:r.int(),',
            'id:r.long(),',
            'accessHash:r.long(),',
            '}',
        )
        test(
            'contact#145ade0b user_id:long mutual:Bool = Contact;',
            'return{',
            "_:'contact',",
            'userId:r.long(),',
            'mutual:r.boolean(),',
            '}',
        )
        test(
            'maskCoords#aed6dbb2 n:int x:double y:double zoom:double = MaskCoords;',
            'return{',
            "_:'maskCoords',",
            'n:r.int(),',
            'x:r.double(),',
            'y:r.double(),',
            'zoom:r.double(),',
            '}',
        )
    })

    it('generates code for constructors with true flags', () => {
        test(
            'messages.messageEditData#26b5dde6 flags:# caption:flags.0?true = messages.MessageEditData;',
            'var flags=r.uint();',
            'return{',
            "_:'messages.messageEditData',",
            'caption:!!(flags&1),',
            '}',
        )
    })

    it('generates code for constructors with optional arguments', () => {
        test(
            'updates.channelDifferenceEmpty#3e11affb flags:# final:flags.0?true pts:int timeout:flags.1?int = updates.ChannelDifference;',
            'var flags=r.uint();',
            'return{',
            "_:'updates.channelDifferenceEmpty',",
            'final:!!(flags&1),',
            'pts:r.int(),',
            'timeout:flags&2?r.int():void 0,',
            '}',
        )
    })

    it('generates code for constructors with arguments before flags field', () => {
        test(
            'poll#86e18161 id:long flags:# quiz:flags.3?true question:string = Poll;',
            'var id=r.long(),',
            'flags=r.uint();',
            'return{',
            "_:'poll',",
            'id:id,',
            'quiz:!!(flags&8),',
            'question:r.string(),',
            '}',
        )
    })

    it('generates code for constructors with multiple flags fields', () => {
        test(
            'updates.channelDifferenceEmpty#3e11affb flags:# final:flags.0?true pts:int timeout:flags.1?int flags2:# can_delete_channel:flags2.0?true = updates.ChannelDifference;',
            'var flags=r.uint(),',
            'pts=r.int(),',
            'timeout=flags&2?r.int():void 0,',
            'flags2=r.uint();',
            'return{',
            "_:'updates.channelDifferenceEmpty',",
            'final:!!(flags&1),',
            'pts:pts,',
            'timeout:timeout,',
            'canDeleteChannel:!!(flags2&1),',
            '}',
        )
    })

    it('generates code for constructors with vector arguments', () => {
        test(
            'contacts.resolvedPeer#7f077ad9 peer:Peer chats:Vector<Chat> users:Vector<User> = contacts.ResolvedPeer;',
            'return{',
            "_:'contacts.resolvedPeer',",
            'peer:r.object(),',
            'chats:r.vector(r.object),',
            'users:r.vector(r.object),',
            '}',
        )
    })

    it('generates code for constructors with optional vector arguments', () => {
        test(
            'messages.getWebPagePreview#8b68b0cc flags:# message:string entities:flags.3?Vector<MessageEntity> = MessageMedia;',
            'var flags=r.uint();',
            'return{',
            "_:'messages.getWebPagePreview',",
            'message:r.string(),',
            'entities:flags&8?r.vector(r.object):void 0,',
            '}',
        )
    })

    it('generates code for constructors with generics', () => {
        test(
            'invokeWithLayer#da9b0d0d {X:Type} layer:int query:!X = X;',
            'return{',
            "_:'invokeWithLayer',",
            'layer:r.int(),',
            'query:r.object(),',
            '}',
        )
    })

    it('generates code for bare types', () => {
        test(
            'message#0949d9dc = Message;\n' +
                'msg_container#73f1f8dc messages:vector<%Message> = MessageContainer;',
            'return{',
            "_:'msg_container',",
            'messages:r.vector(m[155834844],1),',
            '}',
        )
        test(
            'future_salt#0949d9dc = FutureSalt;\n' +
                'future_salts#ae500895 salts:Vector<future_salt> current:FutureSalt = FutureSalts;',
            'return{',
            "_:'future_salts',",
            'salts:r.vector(m[155834844]),',
            'current:r.object(),',
            '}',
        )
        test(
            'future_salt#0949d9dc = FutureSalt;\n' +
                'future_salts#ae500895 salts:vector<future_salt> current:future_salt = FutureSalts;',
            'return{',
            "_:'future_salts',",
            'salts:r.vector(m[155834844],1),',
            'current:m[155834844](r),',
            '}',
        )
    })

    it('generates code with raw flags for constructors with flags', () => {
        const entry = parseTlToEntries('test flags:# flags2:# = Test;')[0]
        expect(generateReaderCodeForTlEntry(entry, { includeFlags: true })).eq(
            `${entry.id}:function(r){${[
                'var flags=r.uint(),',
                'flags2=r.uint();',
                'return{',
                "_:'test',",
                'flags:flags,',
                'flags2:flags2,',
                '}',
            ].join('')}},`,
        )
    })
})
