import { BaseTelegramClient, Long, PartialOnly, tl } from '@mtcute/core'

/**
 * Import contacts to your Telegram contacts list.
 *
 * @param contacts  List of contacts
 */
export async function importContacts(
    client: BaseTelegramClient,
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
