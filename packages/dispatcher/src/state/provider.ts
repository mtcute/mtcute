import { IStorageProvider } from '@mtcute/core'

import { IStateRepository } from './repository.js'

export type IStateStorageProvider = IStorageProvider<{
    state: IStateRepository
}>
