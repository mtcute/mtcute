import { describe, expect, it } from 'vitest'

import { hexDecodeToBuffer, utf8EncodeToBuffer } from '@mtcute/core/utils.js'

import { isProbablyPlainText } from './file-utils.js'

describe('isProbablyPlainText', () => {
    it('should return true for buffers only containing printable ascii', () => {
        expect(isProbablyPlainText(utf8EncodeToBuffer('hello this is some ascii text'))).to.be.true
        expect(isProbablyPlainText(utf8EncodeToBuffer('hello this is some ascii text\nwith unix new lines'))).to.be.true
        expect(isProbablyPlainText(utf8EncodeToBuffer('hello this is some ascii text\r\nwith windows new lines'))).to.be
            .true
        expect(isProbablyPlainText(utf8EncodeToBuffer('hello this is some ascii text\n\twith unix new lines and tabs')))
            .to.be.true
        expect(
            isProbablyPlainText(
                utf8EncodeToBuffer('hello this is some ascii text\r\n\twith windows new lines and tabs'),
            ),
        ).to.be.true
    })

    it('should return false for buffers containing some binary data', () => {
        expect(isProbablyPlainText(utf8EncodeToBuffer('hello this is cedilla: ç'))).to.be.false
        expect(isProbablyPlainText(utf8EncodeToBuffer('hello this is some ascii text with emojis 🌸'))).to.be.false

        // random strings of 16 bytes
        expect(isProbablyPlainText(hexDecodeToBuffer('717f80f08eb9d88c3931712c0e2be32f'))).to.be.false
        expect(isProbablyPlainText(hexDecodeToBuffer('20e8e218e54254c813b261432b0330d7'))).to.be.false
    })
})
