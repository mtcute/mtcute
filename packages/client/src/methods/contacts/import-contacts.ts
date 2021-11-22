import { TelegramClient } from '../../client'
import { tl } from '@mtcute/tl'
import { PartialOnly } from '@mtcute/core'
import Long from 'long'

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
    let seq = Long.ZERO

    const contactsNorm: tl.RawInputPhoneContact[] = contacts.map((input) => ({
        _: 'inputPhoneContact',
        clientId: (seq = seq.add(1)),
        ...input,
    }))

    return await this.call({
        _: 'contacts.importContacts',
        contacts: contactsNorm,
    })
}
