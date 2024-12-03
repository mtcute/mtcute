import type { FileDownloadLocation } from '@mtcute/core'

import { createHash } from 'node:crypto'
import { Thumbnail } from '@mtcute/core'
import { TelegramClient } from '@mtcute/core/client.js'
import { sleep } from '@mtcute/core/utils.js'
import { assertEquals } from 'https://deno.land/std@0.223.0/assert/mod.ts'

import { getApiParams } from '../utils.ts'

const CINNAMOROLL_PFP_CHAT = 'test_file_dc2'
const CINNAMOROLL_PFP_THUMB_SHA256 = '3e6f220235a12547c16129f50c19ed3224d39b827414d1d500f79569a3431eae'
const CINNAMOROLL_PFP_SHA256 = '4d9836a71ac039f5656cde55b83525871549bfbff9cfb658c3f8381c5ba89ce8'

const UWU_MSG = 'https://t.me/test_file_dc2/8'
const UWU_SHA256 = '357b78c9f9d20e813f729a19dd90c6727f30ebd4c8c83557022285f283a705b9'

const SHREK_MSG = 'https://t.me/test_file_dc2/11'
const SHREK_SHA256 = 'd3e6434e027f3d31dc3e05c6ea2eaf84fdd1fb00774a215f89d9ed8b56f86258'

const LARGE_MSG = 'https://t.me/test_file_dc2/12'

async function downloadAsSha256(client: TelegramClient, location: FileDownloadLocation): Promise<string> {
    const sha = createHash('sha256')

    for await (const chunk of client.downloadAsIterable(location)) {
        sha.update(chunk)
    }

    return sha.digest('hex')
}

Deno.test('3. working with files', { sanitizeResources: false }, async (t) => {
    // sometimes test dcs are overloaded and we get FILE_REFERENCE_EXPIRED
    // because we got multiple -500:No workers running errors in a row
    // we currently don't have file references database, so we can just retry the test for now
    //
    // ...except we can't under deno because it's not implemented
    // https://github.com/denoland/deno/issues/19882
    // this.retries(2)

    await t.step('same-dc', async (t) => {
        const tg = new TelegramClient(getApiParams('dc2.session'))

        await tg.connect()

        await t.step('should download pfp thumbs', async () => {
            const chat = await tg.getChat(CINNAMOROLL_PFP_CHAT)
            if (!chat.photo) throw new Error('Chat has no photo')

            assertEquals(await downloadAsSha256(tg, chat.photo.big), CINNAMOROLL_PFP_THUMB_SHA256)
        })

        await t.step('should download animated pfps', async () => {
            const chat = await tg.getFullChat(CINNAMOROLL_PFP_CHAT)
            const thumb = chat.fullPhoto?.getThumbnail(Thumbnail.THUMB_VIDEO_PROFILE)
            if (!thumb) throw new Error('Chat has no animated pfp')

            assertEquals(await downloadAsSha256(tg, thumb), CINNAMOROLL_PFP_SHA256)
        })

        await t.step('should download photos', async () => {
            const msg = await tg.getMessageByLink(UWU_MSG)

            if (msg?.media?.type !== 'photo') {
                throw new Error('Message not found or not a photo')
            }

            assertEquals(await downloadAsSha256(tg, msg.media), UWU_SHA256)
        })

        await t.step('should download documents', async () => {
            const msg = await tg.getMessageByLink(SHREK_MSG)

            if (msg?.media?.type !== 'document') {
                throw new Error('Message not found or not a document')
            }

            assertEquals(await downloadAsSha256(tg, msg.media), SHREK_SHA256)
        })

        await t.step('should cancel downloads', async () => {
            const msg = await tg.getMessageByLink(LARGE_MSG)

            if (msg?.media?.type !== 'document') {
                throw new Error('Message not found or not a document')
            }

            const media = msg.media

            const abort = new AbortController()

            let downloaded = 0

            async function download() {
                const dl = tg.downloadAsIterable(media, { abortSignal: abort.signal })

                try {
                    for await (const chunk of dl) {
                        downloaded += chunk.length
                    }
                } catch (e) {
                    if (!(e instanceof DOMException && e.name === 'AbortError')) throw e
                }
            }

            const promise = download()

            // let it download for 10 seconds
            await sleep(10000)
            abort.abort()
            // abort and snap the downloaded amount
            const downloadedBefore = downloaded

            const avgSpeed = downloaded / 10
            // eslint-disable-next-line no-console
            console.log('Average speed: %d KiB/s', avgSpeed / 1024)

            // wait a bit more to make sure it's aborted
            await sleep(2000)
            await promise

            assertEquals(downloaded, downloadedBefore, 'nothing should be downloaded after abort')
        })

        await tg.close()
    })

    await t.step('cross-dc', async (t) => {
        const tg = new TelegramClient(getApiParams('dc1.session'))

        await tg.connect()

        await t.step('should download pfp thumbs', async () => {
            const chat = await tg.getChat(CINNAMOROLL_PFP_CHAT)
            if (!chat.photo) throw new Error('Chat has no photo')

            assertEquals(await downloadAsSha256(tg, chat.photo.big), CINNAMOROLL_PFP_THUMB_SHA256)
        })

        await t.step('should download animated pfps', async () => {
            const chat = await tg.getFullChat(CINNAMOROLL_PFP_CHAT)
            const thumb = chat.fullPhoto?.getThumbnail(Thumbnail.THUMB_VIDEO_PROFILE)
            if (!thumb) throw new Error('Chat has no animated pfp')

            assertEquals(await downloadAsSha256(tg, thumb), CINNAMOROLL_PFP_SHA256)
        })

        await t.step('should download photos', async () => {
            const msg = await tg.getMessageByLink(UWU_MSG)

            if (msg?.media?.type !== 'photo') {
                throw new Error('Message not found or not a photo')
            }

            assertEquals(await downloadAsSha256(tg, msg.media), UWU_SHA256)
        })

        await t.step('should download documents', async () => {
            const msg = await tg.getMessageByLink(SHREK_MSG)

            if (msg?.media?.type !== 'document') {
                throw new Error('Message not found or not a document')
            }

            assertEquals(await downloadAsSha256(tg, msg.media), SHREK_SHA256)
        })

        await tg.close()
    })
})
