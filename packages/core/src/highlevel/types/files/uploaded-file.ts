import type { tl } from '@mtcute/tl'

/**
 * Describes a file uploaded to the Telegram servers
 * using {@link TelegramClient.uploadFile} method.
 */
export interface UploadedFile {
  /**
   * Raw TL input file to be used in other methods.
   *
   * Very low-level stuff, usually you shouldn't care about it.
   */
  inputFile: tl.TypeInputFile

  /**
   * File size in bytes
   */
  size: number

  /**
   * File MIME type, either the one passed or
   * the one derived from file contents.
   */
  mime: string
}

/** @internal */
export function isUploadedFile(obj: unknown): obj is UploadedFile {
  return obj !== null && typeof obj === 'object' && 'inputFile' in obj && 'size' in obj && 'mime' in obj
}
