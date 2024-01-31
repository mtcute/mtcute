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
    constructor(
        private mt: StorageManager,
        private options: TelegramStorageManagerOptions & TelegramStorageManagerExtraOptions,
    ) {}

    private provider = this.options.provider

    readonly updates = new UpdatesStateService(this.provider.kv, this.mt._serviceOptions)
    readonly self: PublicPart<CurrentUserService> = new CurrentUserService(this.provider.kv, this.mt._serviceOptions)
    readonly refMsgs = new RefMessagesService(
        this.options.refMessages ?? {},
        this.provider.refMessages,
        this.mt._serviceOptions,
    )
    readonly peers: PublicPart<PeersService> = new PeersService(
        this.options.peers ?? {},
        this.provider.peers,
        this.refMsgs,
        this.mt._serviceOptions,
    )

    async clear() {
        await this.provider.peers.deleteAll()
        await this.provider.refMessages.deleteAll()
        await this.mt.clear()
    }
}
