import { assertEquals } from 'https://deno.land/std@0.223.0/assert/mod.ts'
import { ige256Decrypt, ige256Encrypt } from '@mtcute/wasm'
import { WebCryptoProvider, WebPlatform } from '@mtcute/web'

await new WebCryptoProvider().initialize()
const platform = new WebPlatform()

Deno.test('@mtcute/wasm', async (t) => {
    const key = platform.hexDecode('5468697320697320616E20696D706C655468697320697320616E20696D706C65')
    const iv = platform.hexDecode('6D656E746174696F6E206F6620494745206D6F646520666F72204F70656E5353')

    const data = platform.hexDecode('99706487a1cde613bc6de0b6f24b1c7aa448c8b9c3403e3467a8cad89340f53b')
    const dataEnc = platform.hexDecode('792ea8ae577b1a66cb3bd92679b8030ca54ee631976bd3a04547fdcb4639fa69')

    await t.step('should work with Buffers', () => {
        assertEquals(ige256Encrypt(data, key, iv), dataEnc)
        assertEquals(ige256Decrypt(dataEnc, key, iv), data)
    })

    await t.step('should work with Uint8Arrays', () => {
        assertEquals(ige256Encrypt(data, key, iv), dataEnc)
        assertEquals(ige256Decrypt(dataEnc, key, iv), data)
    })
})
