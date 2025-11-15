import type { Long } from '@mtcute/core'

export interface TdAuthKey {
  dcId: number
  key: Uint8Array
}

export interface TdMtpAuthorization {
  userId: Long
  mainDcId: number
  authKeys: TdAuthKey[]
  authKeysToDestroy: TdAuthKey[]
}

export interface InputTdKeyData {
  localKey?: Uint8Array
  version?: number
  count: number
  order: number[]
  active: number
}

export interface TdKeyData extends InputTdKeyData {
  version: number
  localKey: Uint8Array
}
