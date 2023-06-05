import { expect } from 'chai'
import { describe, it } from 'mocha'
import { Readable } from 'stream'

import { readStreamUntilEnd } from '../src/utils/stream-utils'

describe('readStreamUntilEnd', () => {
    it('should read stream until end', async () => {
        const stream = new Readable({
            read() {
                this.push(Buffer.from('aaeeff', 'hex'))
                this.push(Buffer.from('ff33ee', 'hex'))
                this.push(null)
            },
        })

        expect((await readStreamUntilEnd(stream)).toString('hex')).eq(
            'aaeeffff33ee',
        )
    })
})
