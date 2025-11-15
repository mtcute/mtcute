import type { IMtStorageProvider } from '../../storage/provider.js'

import type { IPeersRepository } from './repository/peers.js'
import type { IReferenceMessagesRepository } from './repository/ref-messages.js'

export interface ITelegramStorageProvider extends IMtStorageProvider {
  readonly peers: IPeersRepository
  readonly refMessages: IReferenceMessagesRepository
}
