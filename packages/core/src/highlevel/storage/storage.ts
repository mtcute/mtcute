import { ServiceOptions } from '../../storage/service/base.js'
import { StorageManager } from '../../storage/storage.js'
import { PublicPart } from '../../types/utils.js'
import { ITelegramStorageProvider } from './provider.js'
import { CurrentUserService } from './service/current-user.js'
import { PeersService, PeersServiceOptions } from './service/peers.js'
import { RefMessagesService, RefMessagesServiceOptions } from './service/ref-messages.js'
import { UpdatesStateService } from './service/updates.js'

interface TelegramStorageManagerOptions {
    provider: ITelegramStorageProvider
}

/** @internal */
export interface TelegramStorageManagerExtraOptions {
    refMessages?: RefMessagesServiceOptions
    peers?: PeersServiceOptions
}

export class TelegramStorageManager {
    private provider

    readonly updates
    readonly self: PublicPart<CurrentUserService>
    readonly refMsgs
    readonly peers: PublicPart<PeersService>

    constructor(
        private mt: StorageManager,
        private options: TelegramStorageManagerOptions & TelegramStorageManagerExtraOptions,
    ) {
        this.provider = this.options.provider

        const serviceOptions: ServiceOptions = {
            driver: this.mt.driver,
            readerMap: this.mt.options.readerMap,
            writerMap: this.mt.options.writerMap,
            log: this.mt.log,
        }

        this.updates = new UpdatesStateService(this.provider.kv, serviceOptions)
        this.self = new CurrentUserService(this.provider.kv, serviceOptions)
        this.refMsgs = new RefMessagesService(
            this.options.refMessages ?? {},
            this.provider.refMessages,
            serviceOptions,
        )
        this.peers = new PeersService(
            this.options.peers ?? {},
            this.provider.peers,
            this.refMsgs,
            serviceOptions,
        )
    }

    async clear(withAuthKeys = false) {
        await this.provider.peers.deleteAll()
        await this.provider.refMessages.deleteAll()
        await this.mt.clear(withAuthKeys)
    }
}
