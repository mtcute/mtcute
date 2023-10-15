const Long = require('long')

const {
    TlBinaryReader,
    TlBinaryWriter,
    hexEncode,
} = require('@mtcute/tl-runtime')
const { tl } = require('@mtcute/tl')
const { __tlReaderMap } = require('@mtcute/tl/binary/reader')
const { __tlWriterMap } = require('@mtcute/tl/binary/writer')
const { describe, it } = require('mocha')
const { expect } = require('chai')

// here we primarily want to check that @mtcute/tl correctly works with @mtcute/tl-runtime

describe('@mtcute/tl', () => {
    it('writers map works with TlBinaryWriter', () => {
        const obj = {
            _: 'inputPeerUser',
            userId: 123,
            accessHash: Long.fromNumber(456),
        }

        expect(hexEncode(TlBinaryWriter.serializeObject(__tlWriterMap, obj))).to.equal('4ca5e8dd7b00000000000000c801000000000000')
    })

    it('readers map works with TlBinaryReader', () => {
        const buf = Buffer.from('4ca5e8dd7b00000000000000c801000000000000', 'hex')
        const obj = TlBinaryReader.deserializeObject(__tlReaderMap, buf)

        expect(obj._).equal('inputPeerUser')
        expect(obj.userId).equal(123)
        expect(obj.accessHash.toString()).equal('456')
    })

    it('correctly checks for combinator types', () => {
        expect(tl.isAnyInputUser({ _: 'inputUserEmpty' })).to.be.true
    })
})
