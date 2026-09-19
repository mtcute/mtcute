import type { ITelegramClient } from '../../client.types.js'
import type { InputDocumentId, InputMediaAudio } from '../../types/index.js'
import { assertTrue } from '../../../utils/type-assertions.js'
import { _normalizeFileToDocument, _normalizeInputDocumentId } from '../files/normalize-file-to-document.js'

/**
 * Save a music file to the current user's profile
 */
export async function saveMusicToProfile(
  client: ITelegramClient,
  params: {
    /** Audio file to save (or its ID) */
    audio: InputMediaAudio | InputDocumentId
    /** Optionally, document ID after which we should insert the music */
    after?: InputDocumentId

    /**
     * Upload progress callback
     *
     * @param uploaded  Number of bytes uploaded
     * @param total  Total file size
     */
    progressCallback?: (uploaded: number, total: number) => void
  },
): Promise<void> {
  const res = await client.call({
    _: 'account.saveMusic',
    id: await _normalizeFileToDocument(client, params.audio, {
      progressCallback: params.progressCallback,
      uploadPeer: { _: 'inputPeerSelf' },
    }),
    afterId: params.after ? _normalizeInputDocumentId(params.after) : undefined,
  })

  assertTrue('account.saveMusic', res)
}

/**
 * Remove a music file from the current user's profile
 */
export async function unsaveMusicFromProfile(
  client: ITelegramClient,
  params: {
    /** ID of the Audio file to unsave */
    audio: InputDocumentId
  },
): Promise<void> {
  const res = await client.call({
    _: 'account.saveMusic',
    id: _normalizeInputDocumentId(params.audio),
    unsave: true,
  })

  assertTrue('account.saveMusic', res)
}
