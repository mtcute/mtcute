import type { tl } from '@mtcute/tl'
import type { PartialOnly } from '../../../types/utils.js'

import type { ITelegramClient } from '../../client.types.js'
import Long from 'long'

/**
 * Import contacts to your Telegram contacts list.
 *
 * @param contacts  List of contacts
 */
export async function importContacts(
    client: ITelegramClient,
    contacts: PartialOnly<Omit<tl.RawInputPhoneContact, '_'>, 'clientId'>[],
): Promise<tl.contacts.RawImportedContacts> {
    let seq = Long.ZERO

    const contactsNorm: tl.RawInputPhoneContact[] = contacts.map(input => ({
        _: 'inputPhoneContact',
        clientId: (seq = seq.add(1)),
        ...input,
    }))

    return client.call({
        _: 'contacts.importContacts',
        contacts: contactsNorm,
    })
}
