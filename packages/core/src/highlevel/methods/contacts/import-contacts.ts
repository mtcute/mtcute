import Long from 'long'

import { tl } from '@mtcute/tl'

import { PartialOnly } from '../../../types/utils.js'
import { ITelegramClient } from '../../client.types.js'

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

    const contactsNorm: tl.RawInputPhoneContact[] = contacts.map((input) => ({
        _: 'inputPhoneContact',
        clientId: (seq = seq.add(1)),
        ...input,
    }))

    return await client.call({
        _: 'contacts.importContacts',
        contacts: contactsNorm,
    })
}
