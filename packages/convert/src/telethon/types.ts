export interface TelethonSession {
  dcId: number
  ipAddress: string
  ipv6: boolean
  port: number
  authKey: Uint8Array
}
