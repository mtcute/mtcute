import { TelegramClient } from '../../client'
import { tl } from '@mtqt/tl'
import { PartialOnly } from '@mtqt/core'
import bigInt from 'big-integer'

/**
 * Import contacts to your Telegram contacts list.
 *
 * @param contacts  List of contacts
 * @internal
 */
export async function importContacts(
    this: TelegramClient,
    contacts: PartialOnly<Omit<tl.RawInputPhoneContact, '_'>, 'clientId'>[]
): Promise<tl.contacts.RawImportedContacts> {
    let seq = bigInt.zero

    const contactsNorm: tl.RawInputPhoneContact[] = contacts.map((input) => ({
        _: 'inputPhoneContact',
        clientId: (seq = seq.plus(1)),
        ...input,
    }))

    return await this.call({
        _: 'contacts.importContacts',
        contacts: contactsNorm,
    })
}
