import { expect } from 'chai'
import { describe, it } from 'mocha'

import { isProbablyPlainText } from '../src/utils/file-utils'

describe('isProbablyPlainText', () => {
    it('should return true for buffers only containing printable ascii', () => {
        expect(isProbablyPlainText(Buffer.from('hello this is some ascii text'))).to.be.true
        expect(isProbablyPlainText(Buffer.from('hello this is some ascii text\nwith unix new lines'))).to.be.true
        expect(isProbablyPlainText(Buffer.from('hello this is some ascii text\r\nwith windows new lines'))).to.be.true
        expect(isProbablyPlainText(Buffer.from('hello this is some ascii text\n\twith unix new lines and tabs'))).to.be
            .true
        expect(isProbablyPlainText(Buffer.from('hello this is some ascii text\r\n\twith windows new lines and tabs')))
            .to.be.true
    })

    it('should return false for buffers containing some binary data', () => {
        expect(isProbablyPlainText(Buffer.from('hello this is cedilla: ç'))).to.be.false
        expect(isProbablyPlainText(Buffer.from('hello this is some ascii text with emojis 🌸'))).to.be.false

        // random strings of 16 bytes
        expect(isProbablyPlainText(Buffer.from('717f80f08eb9d88c3931712c0e2be32f', 'hex'))).to.be.false
        expect(isProbablyPlainText(Buffer.from('20e8e218e54254c813b261432b0330d7', 'hex'))).to.be.false
    })
})
