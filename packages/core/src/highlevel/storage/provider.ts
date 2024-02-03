import { IMtStorageProvider } from '../../storage/provider.js'
import { IPeersRepository } from './repository/peers.js'
import { IReferenceMessagesRepository } from './repository/ref-messages.js'

export interface ITelegramStorageProvider extends IMtStorageProvider {
    readonly peers: IPeersRepository
    readonly refMessages: IReferenceMessagesRepository
}
