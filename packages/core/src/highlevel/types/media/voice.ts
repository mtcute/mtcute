import type { tl } from '@mtcute/tl'
import { tdFileId } from '@mtcute/file-id'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { decodeWaveform } from '../../utils/voice-utils.js'

import { RawDocument } from './document.js'

/**
 * An voice note.
 */
export class Voice extends RawDocument {
  readonly type = 'voice' as const

  protected override _fileIdType(): tdFileId.FileType {
    return tdFileId.FileType.VoiceNote
  }

  constructor(
    doc: tl.RawDocument,
    readonly attr: tl.RawDocumentAttributeAudio,
    readonly media?: tl.RawMessageMediaDocument | undefined,
  ) {
    super(doc)
  }

  /**
   * Duration of the voice note in seconds.
   */
  get duration(): number {
    return this.attr.duration
  }

  /**
   * Voice note's waveform
   *
   * Represented with integers in range [0, 31],
   * usually has length of 100
   */
  get waveform(): number[] {
    return decodeWaveform(this.attr.waveform!)
  }

  /** For self-destructing voice notes, TTL in seconds */
  get ttlSeconds(): number | null {
    return this.media?.ttlSeconds ?? null
  }
}
memoizeGetters(Voice, ['fileName', 'thumbnails', 'fileId', 'uniqueFileId', 'waveform'])
makeInspectable(Voice, ['fileSize', 'dcId'], ['inputMedia', 'inputDocument', 'waveform'])
