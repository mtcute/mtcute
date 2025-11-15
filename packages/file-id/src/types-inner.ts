import type Long from 'long'

export const PERSISTENT_ID_VERSION_OLD = 2
export const PERSISTENT_ID_VERSION = 4

export const WEB_LOCATION_FLAG: number = 1 << 24
export const FILE_REFERENCE_FLAG: number = 1 << 25

export const CURRENT_VERSION = 54

/**
 * An error occurred while parsing or serializing a File ID
 */
export class FileIdError extends Error {}

/**
 * A newer version of File ID is provided, which is
 * currently not supported by the library.
 *
 * Feel free to open an issue on Github!
 */
export class UnsupportedError extends FileIdError {}

/**
 * File ID was invalid, meaning that something did not
 * add up while parsing the file ID, or the file ID object
 * contained invalid data.
 */
export class InvalidFileIdError extends FileIdError {}

/**
 * Provided File ID cannot be converted to that TL object.
 */
export class ConversionError extends FileIdError {
  constructor(to: string) {
    super(`Cannot convert given File ID to ${to}`)
  }
}

export enum FileType {
  Thumbnail,
  ProfilePhoto,
  Photo,
  VoiceNote,
  Video,
  Document,
  Encrypted,
  Temp,
  Sticker,
  Audio,
  Animation,
  EncryptedThumbnail,
  Wallpaper,
  VideoNote,
  SecureRaw,
  Secure,
  Background,
  DocumentAsFile,
  Size,
  None,
}

// naming convention just like in @mtcute/tl

// additionally, `_` discriminator is used,
// so we can interoperate with normal TL objects
// like InputFile just by checking `_`

// for nested types, we don't bother with full type name
// for discriminator since it is really only used internally,
// so uniqueness is pretty much guaranteed

/**
 * This photo is a legacy photo that is
 * represented simply by a secret number
 */
export interface RawPhotoSizeSourceLegacy {
  readonly _: 'legacy'
  readonly secret: Long
}

/**
 * This photo is a thumbnail, and its size
 * is provided here as a one-letter string
 */
export interface RawPhotoSizeSourceThumbnail {
  readonly _: 'thumbnail'
  readonly fileType: FileType
  readonly thumbnailType: string
}

/**
 * This photo is a profile photo of
 * some peer, and their ID and access
 * hash are provided here.
 */
export interface RawPhotoSizeSourceDialogPhoto {
  readonly _: 'dialogPhoto'
  readonly big: boolean
  readonly id: number
  readonly accessHash: Long
}

/**
 * This photo is a thumbnail for a a sticker set,
 * and set's ID and access hash are provided here
 */
export interface RawPhotoSizeSourceStickerSetThumbnail {
  readonly _: 'stickerSetThumbnail'
  readonly id: Long
  readonly accessHash: Long
}

/**
 * This photo is a legacy photo containing
 * volume_id, local_id and secret
 */
export interface RawPhotoSizeSourceFullLegacy {
  readonly _: 'fullLegacy'
  readonly volumeId: Long
  readonly localId: number
  readonly secret: Long
}

/**
 * This photo is a legacy dialog photo
 */
export interface RawPhotoSizeSourceDialogPhotoLegacy extends Omit<RawPhotoSizeSourceDialogPhoto, '_'> {
  readonly _: 'dialogPhotoLegacy'
  readonly volumeId: Long
  readonly localId: number
}

/**
 * This photo is a legacy sticker set thumbnail
 */
export interface RawPhotoSizeSourceStickerSetThumbnailLegacy extends Omit<RawPhotoSizeSourceStickerSetThumbnail, '_'> {
  readonly _: 'stickerSetThumbnailLegacy'
  readonly volumeId: Long
  readonly localId: number
}

/**
 * This photo is a legacy sticker set identified by a version
 */
export interface RawPhotoSizeSourceStickerSetThumbnailVersion extends Omit<RawPhotoSizeSourceStickerSetThumbnail, '_'> {
  readonly _: 'stickerSetThumbnailVersion'
  readonly version: number
}

export type TypePhotoSizeSource
  = | RawPhotoSizeSourceLegacy
    | RawPhotoSizeSourceThumbnail
    | RawPhotoSizeSourceDialogPhoto
    | RawPhotoSizeSourceStickerSetThumbnail
    | RawPhotoSizeSourceFullLegacy
    | RawPhotoSizeSourceDialogPhotoLegacy
    | RawPhotoSizeSourceStickerSetThumbnailLegacy
    | RawPhotoSizeSourceStickerSetThumbnailVersion

/**
 * An external web file
 */
export interface RawWebRemoteFileLocation {
  readonly _: 'web'
  readonly url: string
  readonly accessHash: Long
}

/**
 * A photo, that, in addition to ID and access
 * hash, has its own `source` and detailed
 * information about photo location on the
 * servers.
 */
export interface RawPhotoRemoteFileLocation {
  readonly _: 'photo'
  readonly id: Long
  readonly accessHash: Long
  readonly source: TypePhotoSizeSource
}

/**
 * A common file that is represented as a pair
 * of ID and access hash
 */
export interface RawCommonRemoteFileLocation {
  readonly _: 'common'
  readonly id: Long
  readonly accessHash: Long
}

export type TypeRemoteFileLocation = RawWebRemoteFileLocation | RawPhotoRemoteFileLocation | RawCommonRemoteFileLocation

/**
 * An object representing information about
 * file location, that was either parsed from
 * TDLib compatible File ID, or will be parsed
 * to one.
 *
 * This type is supposed to be an intermediate step
 * between TL objects and string file IDs,
 * and if you are using `@mtcute/client`, you don't
 * really need to care about this type at all.
 */
export interface RawFullRemoteFileLocation {
  readonly _: 'remoteFileLocation'

  /**
   * DC ID where this file is located
   */
  readonly dcId: number
  /**
   * Type of the file
   */
  readonly type: FileType
  /**
   * File reference (if any)
   */
  readonly fileReference: Uint8Array | null
  /**
   * Context of the file location
   */
  readonly location: TypeRemoteFileLocation
}

export function isFileIdLike(obj: unknown): obj is string | RawFullRemoteFileLocation {
  return (
    typeof obj === 'string'
    || (obj !== null && typeof obj === 'object' && (obj as { _: unknown })._ === 'remoteFileLocation')
  )
}
