import { tl } from '@mtcute/tl'

import { TelegramClient } from '../../client'
import { Document, RawDocument } from './document'
import { Audio } from './audio'
import { Video } from './video'
import { Voice } from './voice'
import { Sticker } from './sticker'

/** @internal */
export function parseDocument(
    client: TelegramClient,
    doc: tl.RawDocument
): RawDocument {
    for (const attr of doc.attributes) {
        switch (attr._) {
            case 'documentAttributeAudio':
                if (attr.voice) {
                    return new Voice(client, doc, attr)
                } else {
                    return new Audio(client, doc, attr)
                }
            case 'documentAttributeSticker': {
                const sz = doc.attributes.find(
                    (it) =>
                        it._ === 'documentAttributeImageSize' ||
                        it._ === 'documentAttributeVideo'
                )! as
                    | tl.RawDocumentAttributeImageSize
                    | tl.RawDocumentAttributeVideo
                return new Sticker(client, doc, attr, sz)
            }
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
