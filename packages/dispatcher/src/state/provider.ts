import type { IStorageProvider } from '@mtcute/core'

import type { IStateRepository } from './repository.js'

export type IStateStorageProvider = IStorageProvider<{
  state: IStateRepository
}>
