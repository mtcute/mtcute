import { __tlReaderMap } from '@mtcute/tl/binary/reader.js'
import { __tlWriterMap } from '@mtcute/tl/binary/writer.js'

import { LogManager } from '../../utils/logger.js'
import { MemoryStorageDriver } from '../memory/driver.js'
import { ServiceOptions } from './base.js'

export function testServiceOptions(): ServiceOptions {
    const logger = new LogManager()
    logger.level = 0

    return {
        driver: new MemoryStorageDriver(),
        readerMap: __tlReaderMap,
        writerMap: __tlWriterMap,
        log: logger,
    }
}
