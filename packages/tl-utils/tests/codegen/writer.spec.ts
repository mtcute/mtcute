import { expect } from 'chai'
import { describe, it } from 'mocha'

import { generateWriterCodeForTlEntries, generateWriterCodeForTlEntry, parseTlToEntries } from '../../src/index.js'

describe('generateWriterCodeForTlEntry', () => {
    const test = (tl: string, ...js: string[]) => {
        const entry = parseTlToEntries(tl).slice(-1)[0]
        expect(generateWriterCodeForTlEntry(entry)).eq(
            `'${entry.name}':function(w${entry.arguments.length ? ',v' : ''}){w.uint(${entry.id});${js.join('')}},`,
        )
    }

    it('generates code for constructors without arguments', () => {
        test('topPeerCategoryBotsPM#ab661b5b = TopPeerCategory;')
    })

    it('generates code for constructors with simple arguments', () => {
        test(
            'inputBotInlineMessageID#890c3d89 dc_id:int id:long access_hash:long = InputBotInlineMessageID;',
            "w.int(h(v,'dcId'));",
            "w.long(h(v,'id'));",
            "w.long(h(v,'accessHash'));",
        )
        test(
            'contact#145ade0b user_id:long mutual:Bool = Contact;',
            "w.long(h(v,'userId'));",
            "w.boolean(h(v,'mutual'));",
        )
        test(
            'maskCoords#aed6dbb2 n:int x:double y:double zoom:double = MaskCoords;',
            "w.int(h(v,'n'));",
            "w.double(h(v,'x'));",
            "w.double(h(v,'y'));",
            "w.double(h(v,'zoom'));",
        )
    })

    it('generates code for constructors with true flags', () => {
        test(
            'messages.messageEditData#26b5dde6 flags:# caption:flags.0?true = messages.MessageEditData;',
            'var flags=0;',
            'if(v.caption===true)flags|=1;',
            'w.uint(flags);',
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
            "w.int(h(v,'pts'));",
            'if(_timeout)w.int(v.timeout);',
        )
    })

    it('generates code for constructors with multiple flags fields', () => {
        test(
            'updates.channelDifferenceEmpty#3e11affb flags:# final:flags.0?true pts:int timeout:flags.1?int flags2:# can_delete_channel:flags2.0?true = updates.ChannelDifference;',
            'var flags=0;',
            'if(v.final===true)flags|=1;',
            'var _timeout=v.timeout!==undefined;',
            'if(_timeout)flags|=2;',
            'w.uint(flags);',
            "w.int(h(v,'pts'));",
            'if(_timeout)w.int(v.timeout);',
            'var flags2=0;',
            'if(v.canDeleteChannel===true)flags2|=1;',
            'w.uint(flags2);',
        )
    })

    it('generates code for constructors with multiple fields using the same flag', () => {
        test(
            'inputMediaPoll#f94e5f1 flags:# solution:flags.1?string solution_entities:flags.1?Vector<MessageEntity> = InputMedia;',
            'var flags=0;',
            'var _solution=v.solution!==undefined;',
            'var _solutionEntities=v.solutionEntities&&v.solutionEntities.length;',
            'var _flags_1=_solution||_solutionEntities;',
            'if(_flags_1)flags|=2;',
            'w.uint(flags);',
            'if(_flags_1)w.string(v.solution);',
            'if(_flags_1)w.vector(w.object,v.solutionEntities);',
        )
    })

    it('generates code for constructors with vector arguments', () => {
        test(
            'contacts.resolvedPeer#7f077ad9 peer:Peer chats:Vector<Chat> users:Vector<User> = contacts.ResolvedPeer;',
            "w.object(h(v,'peer'));",
            "w.vector(w.object,h(v,'chats'));",
            "w.vector(w.object,h(v,'users'));",
        )
    })

    it('generates code for constructors with optional vector arguments', () => {
        test(
            'messages.getWebPagePreview#8b68b0cc flags:# message:string entities:flags.3?Vector<MessageEntity> = MessageMedia;',
            'var flags=0;',
            'var _entities=v.entities&&v.entities.length;',
            'if(_entities)flags|=8;',
            'w.uint(flags);',
            "w.string(h(v,'message'));",
            'if(_entities)w.vector(w.object,v.entities);',
        )
    })

    it('generates code for constructors with generics', () => {
        test(
            'invokeWithLayer#da9b0d0d {X:Type} layer:int query:!X = X;',
            "w.int(h(v,'layer'));",
            "w.object(h(v,'query'));",
        )
    })

    it('generates code for bare vectors', () => {
        test(
            'message#0949d9dc = Message;\n' + 'msg_container#73f1f8dc messages:vector<%Message> = MessageContainer;',
            "w.vector(m._bare[155834844],h(v,'messages'),1);",
        )
        test(
            'future_salt#0949d9dc = FutureSalt;\n' +
                'future_salts#ae500895 salts:Vector<future_salt> current:FutureSalt = FutureSalts;',
            "w.vector(m._bare[155834844],h(v,'salts'));",
            "w.object(h(v,'current'));",
        )
    })

    it('generates code for bare types', () => {
        const entries = parseTlToEntries(
            'future_salt#0949d9dc salt:bytes = FutureSalt;\n' +
                'future_salts#ae500895 salts:vector<future_salt> current:future_salt = FutureSalts;',
        )

        expect(generateWriterCodeForTlEntries(entries, { includePrelude: false })).eq(
            `
            var m={
                'future_salt':function(w,v){w.uint(155834844);w.bytes(h(v,'salt'));},
                'future_salts':function(w,v){w.uint(2924480661);w.vector(m._bare[155834844],h(v,'salts'),1);m._bare[155834844](w,h(v,'current'));},
                _bare:{
                    155834844:function(w=this,v){w.bytes(h(v,'salt'));},
                },
            }`.replace(/^\s+/gm, ''),
        )
    })

    it('generates code with raw flags for constructors with flags', () => {
        const entry = parseTlToEntries('test flags:# flags2:# = Test;')[0]
        expect(generateWriterCodeForTlEntry(entry, { includeFlags: true })).eq(
            `'${entry.name}':function(w,v){${[
                `w.uint(${entry.id});`,
                'var flags=v.flags;',
                'w.uint(flags);',
                'var flags2=v.flags2;',
                'w.uint(flags2);',
            ].join('')}},`,
        )
    })
})
