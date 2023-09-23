import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { Audio } from './audio'
import { Document } from './document'
import { Sticker } from './sticker'
import { Video } from './video'
import { Voice } from './voice'

export type ParsedDocument = Sticker | Voice | Audio | Video | Document

/** @internal */
export function parseDocument(client: TelegramClient, doc: tl.RawDocument): ParsedDocument {
    const stickerAttr = doc.attributes.find(
        (a) => a._ === 'documentAttributeSticker' || a._ === 'documentAttributeCustomEmoji',
    )

    if (stickerAttr) {
        const sz = doc.attributes.find(
            (it) => it._ === 'documentAttributeImageSize' || it._ === 'documentAttributeVideo',
        )! as tl.RawDocumentAttributeImageSize | tl.RawDocumentAttributeVideo

        return new Sticker(
            client,
            doc,
            stickerAttr as tl.RawDocumentAttributeSticker | tl.RawDocumentAttributeCustomEmoji,
            sz,
        )
    }

    for (const attr of doc.attributes) {
        switch (attr._) {
            case 'documentAttributeAudio':
                if (attr.voice) {
                    return new Voice(client, doc, attr)
                }

                return new Audio(client, doc, attr)

            case 'documentAttributeVideo':
                return new Video(client, doc, attr)

            case 'documentAttributeImageSize':
                // legacy gif
                if (doc.mimeType === 'image/gif') {
                    return new Video(client, doc, attr)
                }
        }
    }

    return new Document(client, doc)
}
