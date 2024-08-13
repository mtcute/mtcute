import { assertEquals } from 'https://deno.land/std@0.223.0/assert/mod.ts'
import { Long } from '@mtcute/core'
import { setPlatform } from '@mtcute/core/platform.js'
import { TlBinaryReader, TlBinaryWriter, TlSerializationCounter } from '@mtcute/tl-runtime'
import { WebPlatform } from '@mtcute/web'

// here we primarily want to check that everything imports properly,
// and that the code is actually executable. The actual correctness
// of the implementation is covered tested by unit tests

const p = new WebPlatform()
setPlatform(p)

Deno.test('encodings', () => {
    assertEquals(p.hexEncode(new Uint8Array([1, 2, 3, 4, 5])), '0102030405')
})

Deno.test('TlBinaryReader', () => {
    const map = {
        85337187(r: any) {
            const ret: any = {}
            ret._ = 'mt_resPQ'
            ret.nonce = r.int128()
            ret.serverNonce = r.int128()
            ret.pq = r.bytes()
            ret.serverPublicKeyFingerprints = r.vector(r.long)

            return ret
        },
    }
    const data
        = '000000000000000001c8831ec97ae55140000000632416053e0549828cca27e966b301a48fece2fca5cf4d33f4a11ea877ba4aa5739073300817ed48941a08f98100000015c4b51c01000000216be86c022bb4c3'
    const buf = p.hexDecode(data)

    const r = new TlBinaryReader(map, buf, 8)

    assertEquals(r.long().toString(16), '51e57ac91e83c801')
    assertEquals(r.uint(), 64)

    const obj: any = r.object()
    assertEquals(obj._, 'mt_resPQ')
})

Deno.test('TlBinaryWriter', () => {
    const map = {
        mt_resPQ(w: any, obj: any) {
            w.uint(85337187)
            w.bytes(obj.pq)
            w.vector(w.long, obj.serverPublicKeyFingerprints)
        },
        _staticSize: {} as any,
    }

    const obj = {
        _: 'mt_resPQ',
        pq: p.hexDecode('17ED48941A08F981'),
        serverPublicKeyFingerprints: [Long.fromString('c3b42b026ce86b21', 16)],
    }

    assertEquals(TlSerializationCounter.countNeededBytes(map, obj), 32)

    const w = TlBinaryWriter.alloc(map, 48)
    w.long(Long.ZERO)
    w.long(Long.fromString('51E57AC91E83C801', true, 16)) // messageId
    w.object(obj)

    assertEquals(
        p.hexEncode(w.result()),
        '000000000000000001c8831ec97ae551632416050817ed48941a08f98100000015c4b51c01000000216be86c022bb4c3',
    )
})
