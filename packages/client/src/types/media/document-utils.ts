import { tl } from '@mtcute/tl'
import { Document, RawDocument } from './document'
import { Audio } from './audio'
import { TelegramClient } from '../../client'
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
                    (it) => it._ === 'documentAttributeImageSize'
                )! as tl.RawDocumentAttributeImageSize
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
