import { tl } from '@mtcute/tl'

import { Audio } from './audio.js'
import { Document } from './document.js'
import { Sticker } from './sticker.js'
import { Video } from './video.js'
import { Voice } from './voice.js'

export type ParsedDocument = Sticker | Voice | Audio | Video | Document

/** @internal */
export function parseSticker(doc: tl.RawDocument) {
    const stickerAttr = doc.attributes.find(
        (a) => a._ === 'documentAttributeSticker' || a._ === 'documentAttributeCustomEmoji',
    )

    if (stickerAttr) {
        const sz = doc.attributes.find(
            (it) => it._ === 'documentAttributeImageSize' || it._ === 'documentAttributeVideo',
        )! as tl.RawDocumentAttributeImageSize | tl.RawDocumentAttributeVideo

        return new Sticker(doc, stickerAttr as tl.RawDocumentAttributeSticker | tl.RawDocumentAttributeCustomEmoji, sz)
    }
}

/** @internal */
export function parseDocument(doc: tl.RawDocument, media?: tl.RawMessageMediaDocument): ParsedDocument {
    const sticker = parseSticker(doc)
    if (sticker) return sticker

    for (const attr of doc.attributes) {
        switch (attr._) {
            case 'documentAttributeAudio':
                if (attr.voice) {
                    return new Voice(doc, attr)
                }

                return new Audio(doc, attr)

            case 'documentAttributeVideo':
                return new Video(doc, attr, media)

            case 'documentAttributeImageSize':
                // legacy gif
                if (doc.mimeType === 'image/gif') {
                    return new Video(doc, attr, media)
                }
        }
    }

    return new Document(doc)
}
