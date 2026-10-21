import type { ITelegramClient } from '../../client.types.js'

// @available=user
/**
 * Export a link that allows other users to send messages to the current user
 * for free, even if the current user requires payment for incoming messages.
 */
export async function exportNoPaidMessagesToken(
  client: ITelegramClient,
  params?: {
    /**
     * Whether to revoke previously exported links.
     * If {@link temporary} is `false`, the permanent link is revoked too,
     * otherwise only temporary links are revoked
     */
    revoke?: boolean

    /** Whether to export a temporary link */
    temporary?: boolean
  },
): Promise<{
  /** Token that can be passed to {@link importNoPaidMessagesToken} */
  token: string
  /** Link containing the token */
  url: string
  /** Date when the token expires, if it is temporary */
  expires: Date | null
}> {
  const res = await client.call({
    _: 'contacts.exportNoPaidMessagesToken',
    revoke: params?.revoke,
    temporary: params?.temporary,
  })

  return {
    token: res.token,
    url: res.url,
    expires: res.expires ? new Date(res.expires * 1000) : null,
  }
}
