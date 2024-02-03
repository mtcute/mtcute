/* eslint-disable no-restricted-imports */
import { expect } from 'chai'
import { createHash } from 'crypto'
import { describe, it } from 'mocha'

import { FileDownloadLocation, TelegramClient, Thumbnail } from '@mtcute/core'
import { sleep } from '@mtcute/core/utils.js'

import { getApiParams } from '../utils.js'

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

describe('3. working with files', function () {
    this.timeout(300_000)
    // sometimes test dcs are overloaded and we get FILE_REFERENCE_EXPIRED
    // because we got multiple -500:No workers running errors in a row
    // we currently don't have file references database, so we can just retry the test for now
    this.retries(2)

    describe('same-dc', () => {
        const tg = new TelegramClient(getApiParams('dc2.session'))

        this.beforeAll(() => tg.connect())
        this.afterAll(() => tg.close())

        it('should download pfp thumbs', async () => {
            const chat = await tg.getChat(CINNAMOROLL_PFP_CHAT)
            if (!chat.photo) expect.fail('Chat has no photo')

            expect(await downloadAsSha256(tg, chat.photo.big)).to.equal(CINNAMOROLL_PFP_THUMB_SHA256)
        })

        it('should download animated pfps', async () => {
            const chat = await tg.getFullChat(CINNAMOROLL_PFP_CHAT)
            const thumb = chat.fullPhoto?.getThumbnail(Thumbnail.THUMB_VIDEO_PROFILE)
            if (!thumb) expect.fail('Chat has no animated pfp')

            expect(await downloadAsSha256(tg, thumb)).to.equal(CINNAMOROLL_PFP_SHA256)
        })

        it('should download photos', async () => {
            const msg = await tg.getMessageByLink(UWU_MSG)

            if (msg?.media?.type !== 'photo') {
                expect.fail('Message not found or not a photo')
            }

            expect(await downloadAsSha256(tg, msg.media)).to.equal(UWU_SHA256)
        })

        it('should download documents', async () => {
            const msg = await tg.getMessageByLink(SHREK_MSG)

            if (msg?.media?.type !== 'document') {
                expect.fail('Message not found or not a document')
            }

            expect(await downloadAsSha256(tg, msg.media)).to.equal(SHREK_SHA256)
        })

        it('should cancel downloads', async () => {
            const msg = await tg.getMessageByLink(LARGE_MSG)

            if (msg?.media?.type !== 'document') {
                expect.fail('Message not found or not a document')
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

            expect(downloaded).to.equal(downloadedBefore, 'nothing should be downloaded after abort')
        })
    })

    describe('cross-dc', () => {
        const tg = new TelegramClient(getApiParams('dc1.session'))

        this.beforeAll(() => tg.connect())
        this.afterAll(() => tg.close())

        it('should download pfp thumbs', async () => {
            const chat = await tg.getChat(CINNAMOROLL_PFP_CHAT)
            if (!chat.photo) expect.fail('Chat has no photo')

            expect(await downloadAsSha256(tg, chat.photo.big)).to.equal(CINNAMOROLL_PFP_THUMB_SHA256)
        })

        it('should download animated pfps', async () => {
            const chat = await tg.getFullChat(CINNAMOROLL_PFP_CHAT)
            const thumb = chat.fullPhoto?.getThumbnail(Thumbnail.THUMB_VIDEO_PROFILE)
            if (!thumb) expect.fail('Chat has no animated pfp')

            expect(await downloadAsSha256(tg, thumb)).to.equal(CINNAMOROLL_PFP_SHA256)
        })

        it('should download photos', async () => {
            const msg = await tg.getMessageByLink(UWU_MSG)

            if (msg?.media?.type !== 'photo') {
                expect.fail('Message not found or not a photo')
            }

            expect(await downloadAsSha256(tg, msg.media)).to.equal(UWU_SHA256)
        })

        it('should download documents', async () => {
            const msg = await tg.getMessageByLink(SHREK_MSG)

            if (msg?.media?.type !== 'document') {
                expect.fail('Message not found or not a document')
            }

            expect(await downloadAsSha256(tg, msg.media)).to.equal(SHREK_SHA256)
        })
    })
})
