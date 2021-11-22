import { describe, it } from 'mocha'
import { expect } from 'chai'
import { parseTlToEntries } from '../../src/parse'
import { generateWriterCodeForTlEntry } from '../../src/codegen/writer'

describe('generateWriterCodeForTlEntry', () => {
    const test = (tl: string, ...js: string[]) => {
        const entry = parseTlToEntries(tl)[0]
        expect(generateWriterCodeForTlEntry(entry)).eq(
            `'${entry.name}':function(w${
                entry.arguments.length ? ',v' : ''
            }){w.uint(${entry.id});${js.join('')}},`
        )
    }

    it('generates code for constructors without arguments', () => {
        test('topPeerCategoryBotsPM#ab661b5b = TopPeerCategory;')
    })

    it('generates code for constructors with simple arguments', () => {
        test(
            'inputBotInlineMessageID#890c3d89 dc_id:int id:long access_hash:long = InputBotInlineMessageID;',
            "h(v,'dcId');",
            'w.int(v.dcId);',
            "h(v,'id');",
            'w.long(v.id);',
            "h(v,'accessHash');",
            'w.long(v.accessHash);'
        )
        test(
            'contact#145ade0b user_id:long mutual:Bool = Contact;',
            "h(v,'userId');",
            'w.long(v.userId);',
            "h(v,'mutual');",
            'w.boolean(v.mutual);'
        )
        test(
            'maskCoords#aed6dbb2 n:int x:double y:double zoom:double = MaskCoords;',
            "h(v,'n');",
            'w.int(v.n);',
            "h(v,'x');",
            'w.double(v.x);',
            "h(v,'y');",
            'w.double(v.y);',
            "h(v,'zoom');",
            'w.double(v.zoom);'
        )
    })

    it('generates code for constructors with true flags', () => {
        test(
            'messages.messageEditData#26b5dde6 flags:# caption:flags.0?true = messages.MessageEditData;',
            'var flags=0;',
            'if(v.caption===true)flags|=1;',
            'w.uint(flags);'
        )
    })

    it('generates code for constructors with optional arguments', () => {
        test(
            'updates.channelDifferenceEmpty#3e11affb flags:# final:flags.0?true pts:int timeout:flags.1?int = updates.ChannelDifference;',
            'var flags=0;',
            'if(v.final===true)flags|=1;',
            'var _timeout=v.timeout!==undefined;',
            'if(_timeout)flags|=2;',
            'w.uint(flags);',
            "h(v,'pts');",
            'w.int(v.pts);',
            'if(_timeout)w.int(v.timeout);'
        )
    })

    it('generates code for constructors with vector arguments', () => {
        test(
            'contacts.resolvedPeer#7f077ad9 peer:Peer chats:Vector<Chat> users:Vector<User> = contacts.ResolvedPeer;',
            "h(v,'peer');",
            'w.object(v.peer);',
            "h(v,'chats');",
            'w.vector(w.object, v.chats);',
            "h(v,'users');",
            'w.vector(w.object, v.users);'
        )
    })

    it('generates code for constructors with optional vector arguments', () => {
        test(
            'messages.getWebPagePreview#8b68b0cc flags:# message:string entities:flags.3?Vector<MessageEntity> = MessageMedia;',
            'var flags=0;',
            'var _entities=v.entities&&v.entities.length;',
            'if(_entities)flags|=8;',
            'w.uint(flags);',
            "h(v,'message');",
            'w.string(v.message);',
            'if(_entities)w.vector(w.object, v.entities);'
        )
    })

    it('generates code for constructors with generics', () => {
        test(
            'invokeWithLayer#da9b0d0d {X:Type} layer:int query:!X = X;',
            "h(v,'layer');",
            'w.int(v.layer);',
            "h(v,'query');",
            'w.object(v.query);'
        )
    })
})
