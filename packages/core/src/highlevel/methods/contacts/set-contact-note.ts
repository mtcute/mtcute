import type { ITelegramClient } from '../../client.types.js'
import type { InputPeerLike, InputText } from '../../types/index.js'
import { assertTrue } from '../../../utils/index.js'
import { resolveUser } from '../../methods.js'
import { inputTextToTl } from '../../types/index.js'

/**
 * Set a note for a contact
 *
 * @param userId  ID of the user to set the note for
 * @param note  Note text
 */
export async function setContactNote(
  client: ITelegramClient,
  userId: InputPeerLike,
  note: InputText,
): Promise<void> {
  const peer = await resolveUser(client, userId)

  const r = await client.call({
    _: 'contacts.updateContactNote',
    id: peer,
    note: inputTextToTl(note),
  })

  assertTrue('contacts.updateContactNote', r)
}
