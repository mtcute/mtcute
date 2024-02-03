import { tl } from '@mtcute/tl'
import { TlBinaryReader, TlBinaryWriter, TlReaderMap, TlWriterMap } from '@mtcute/tl-runtime'

import { Logger } from '../../utils/logger.js'
import { IStorageDriver } from '../driver.js'

export interface ServiceOptions {
    driver: IStorageDriver
    readerMap: TlReaderMap
    writerMap: TlWriterMap
    log: Logger
}

export class BaseService {
    protected _driver: IStorageDriver
    protected _readerMap: TlReaderMap
    protected _writerMap: TlWriterMap
    protected _log: Logger

    constructor(opts: ServiceOptions) {
        this._driver = opts.driver
        this._readerMap = opts.readerMap
        this._writerMap = opts.writerMap
        this._log = opts.log
    }

    protected _serializeTl(obj: tl.TlObject): Uint8Array {
        return TlBinaryWriter.serializeObject(this._writerMap, obj)
    }

    protected _deserializeTl(data: Uint8Array): tl.TlObject | null {
        try {
            return TlBinaryReader.deserializeObject<tl.TlObject>(this._readerMap, data)
        } catch (e) {
            return null
        }
    }
}
