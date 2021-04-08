// This is a test for TypeScript typings
// This file is never executed, only compiled

import * as rawSchema from '../raw-schema'
import readerMap from '../binary/reader'
import writerMap from '../binary/writer'
import { BadRequestError, RpcError } from '../errors'

const layer: string = rawSchema.apiLayer
Object.entries(rawSchema.api).forEach(([ns, content]) => {
    content.classes.forEach((cls) => {
        const name: string = cls.type
    })
})

readerMap[0].call(null)
writerMap['mt_message'].call(null, {})

const error: RpcError = new BadRequestError(
    'BAD_REQUEST',
    'Client has issued an invalid request'
)
