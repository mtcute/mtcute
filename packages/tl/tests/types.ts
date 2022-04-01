/* eslint-disable */
// This is a test for TypeScript typings
// This file is never executed, only compiled

import readerMap from '../binary/reader'
import writerMap from '../binary/writer'
import { tl } from '../'

readerMap[0].call(null, null)
writerMap['mt_message'].call(null, null, {})

const error: tl.errors.RpcError = new tl.errors.BadRequestError(
    'BAD_REQUEST',
    'Client has issued an invalid request'
)
