import { assertEquals } from 'https://deno.land/std@0.223.0/assert/mod.ts'

import { Long } from '@mtcute/core'
import { setPlatform } from '@mtcute/core/platform.js'
import { tl } from '@mtcute/tl'
import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap } from '@mtcute/tl/binary/writer.js'
import { TlBinaryReader, TlBinaryWriter } from '@mtcute/tl-runtime'
import { WebPlatform } from '@mtcute/web'

// here we primarily want to check that @mtcute/tl correctly works with @mtcute/tl-runtime

const p = new WebPlatform()
setPlatform(p)

Deno.test('@mtcute/tl', async (t) => {
    await t.step('writers map works with TlBinaryWriter', () => {
        const obj = {
            _: 'inputPeerUser',
            userId: 123,
            accessHash: Long.fromNumber(456),
        }

        assertEquals(
            p.hexEncode(TlBinaryWriter.serializeObject(__tlWriterMap, obj)),
            '4ca5e8dd7b00000000000000c801000000000000',
        )
    })

    await t.step('readers map works with TlBinaryReader', () => {
        const buf = p.hexDecode('4ca5e8dd7b00000000000000c801000000000000')
        // eslint-disable-next-line
        const obj = TlBinaryReader.deserializeObject<any>(__tlReaderMap, buf)

        assertEquals(obj._, 'inputPeerUser')
        assertEquals(obj.userId, 123)
        assertEquals(obj.accessHash.toString(), '456')
    })

    await t.step('correctly checks for combinator types', () => {
        assertEquals(tl.isAnyInputUser({ _: 'inputUserEmpty' }), true)
    })
})
