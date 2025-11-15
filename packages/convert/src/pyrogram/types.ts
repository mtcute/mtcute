export interface PyrogramSession {
  apiId?: number
  dcId: number
  isTest: boolean
  authKey: Uint8Array
  userId: number
  isBot: boolean
}
