/* eslint-disable */
// This is a test for TypeScript typings
// This file is never executed, only compiled

import { __tlReaderMap } from '../binary/reader.js'
import { __tlWriterMap } from '../binary/writer.js'
import { tl } from '../index.js'

__tlReaderMap[0].call(null, null)
__tlWriterMap['mt_message'].call(null, null, {})

const error: tl.RpcError = tl.RpcError.create(400, 'BAD_REQUEST')

if (error.is('FLOOD_WAIT_%d')) {
    const a: number = error.seconds
}
