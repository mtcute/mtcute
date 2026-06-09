import type { tl } from '../../../tl/index.js'
import type { ParsedDocument } from '../media/document-utils.js'
import { LongMap } from '../../../utils/long-utils.js'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parseDocument } from '../media/document-utils.js'
import { Photo } from '../media/photo.js'

export class RichMessage {
  constructor(readonly raw: tl.TypeRichMessage) {}

  /** Whether this message is RTL */
  get isRtl(): boolean {
    return this.raw.rtl!
  }

  /** Whether this message is partial */
  get isPart(): boolean {
    return this.raw.part!
  }

  /** Photos in this message */
  get photos(): LongMap<Photo> {
    const map = new LongMap<Photo>()
    for (const photo of this.raw.photos) {
      if (photo._ === 'photoEmpty') continue
      map.set(photo.id, new Photo(photo))
    }
    return map
  }

  /** Documents (usually videos) in this message */
  get documents(): LongMap<ParsedDocument> {
    const map = new LongMap<ParsedDocument>()
    for (const photo of this.raw.documents) {
      if (photo._ === 'documentEmpty') continue
      map.set(photo.id, parseDocument(photo))
    }
    return map
  }

  /** Blocks in this message */
  get blocks(): tl.TypePageBlock[] {
    return this.raw.blocks
  }
}

makeInspectable(RichMessage)
memoizeGetters(RichMessage, ['documents', 'blocks'])
