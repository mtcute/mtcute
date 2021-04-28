import { InputFileLike } from '../files'
import { tl } from '@mtcute/tl'

interface BaseInputMedia {
    /**
     * File to be sent
     */
    file: InputFileLike

    /**
     * Caption of the media
     */
    caption?: string

    /**
     * Caption entities of the media.
     * If passed, parse mode is ignored
     */
    entities?: tl.TypeMessageEntity[]

    /**
     * Override file name for the file.
     */
    fileName?: string
}

/**
 * Automatically detect media type based on file contents.
 *
 * Only works for files that are internally documents, i.e.
 * *does not* infer photos, so use {@link InputMediaPhoto} instead.
 */
export interface InputMediaAuto extends BaseInputMedia {
    type: 'auto'
}

/**
 * An audio file or voice message to be sent
 */
export interface InputMediaAudio extends BaseInputMedia {
    type: 'audio'

    /**
     * Thumbnail of the audio file album cover.
     *
     * The thumbnail should be in JPEG format and less than 200 KB in size.
     * A thumbnail's width and height should not exceed 320 pixels.
     * Thumbnails can't be reused and can be only uploaded as a new file.
     */
    thumb?: InputFileLike

    /**
     * Duration of the audio in seconds
     */
    duration?: number

    /**
     * Performer of the audio
     */
    performer?: string

    /**
     * Title of the audio
     */
    title?: string
}

/**
 * Voice message to be sent
 */
export interface InputMediaVoice extends BaseInputMedia {
    type: 'voice'

    /**
     * Duration of the voice message in seconds
     */
    duration?: number

    /**
     * Waveform of the voice message
     */
    waveform?: Buffer
}

/**
 * A generic file to be sent
 */
export interface InputMediaDocument extends BaseInputMedia {
    type: 'document'

    /**
     * Thumbnail of the document.
     *
     * The thumbnail should be in JPEG format and less than 200 KB in size.
     * A thumbnail's width and height should not exceed 320 pixels.
     * Thumbnails can't be reused and can be only uploaded as a new file.
     */
    thumb?: InputFileLike
}

/**
 * A photo to be sent
 */
export interface InputMediaPhoto extends BaseInputMedia {
    type: 'photo'
}

/**
 * A video to be sent
 */
export interface InputMediaVideo extends BaseInputMedia {
    type: 'video'

    /**
     * Thumbnail of the video.
     *
     * The thumbnail should be in JPEG format and less than 200 KB in size.
     * A thumbnail's width and height should not exceed 320 pixels.
     * Thumbnails can't be reused and can be only uploaded as a new file.
     */
    thumb?: InputFileLike

    /**
     * Width of the video in pixels
     */
    width?: number

    /**
     * Height of the video in pixels
     */
    height?: number

    /**
     * Duration of the video in seconds
     */
    duration?: number

    /**
     * Whether the video is suitable for streaming
     */
    supportsStreaming?: boolean

    /**
     * Whether this video is an animated GIF
     */
    isAnimated?: boolean

    /**
     * Whether this video is a round message (aka video note)
     */
    isRound?: boolean
}

/**
 * Input media that can be sent somewhere.
 *
 * Note that meta-fields (like `duration`) are only
 * applicable if `file` is {@link UploadFileLike},
 * otherwise they are ignored.
 *
 * @see InputMedia
 */
export type InputMediaLike =
    | InputMediaAudio
    | InputMediaVoice
    | InputMediaDocument
    | InputMediaPhoto
    | InputMediaVideo
    | InputMediaAuto

export namespace InputMedia {
    type OmitTypeAndFile<T extends InputMediaLike> = Omit<T, 'type' | 'file'>

    /**
     * Create an animation to be sent
     */
    export function animation(
        file: InputFileLike,
        params?: OmitTypeAndFile<InputMediaVideo>
    ): InputMediaVideo {
        return {
            type: 'video',
            file,
            isAnimated: true,
            ...(params || {}),
        }
    }

    /**
     * Create an audio to be sent
     */
    export function audio(
        file: InputFileLike,
        params?: OmitTypeAndFile<InputMediaAudio>
    ): InputMediaAudio {
        return {
            type: 'audio',
            file,
            ...(params || {}),
        }
    }

    /**
     * Create an document to be sent
     */
    export function document(
        file: InputFileLike,
        params?: OmitTypeAndFile<InputMediaDocument>
    ): InputMediaDocument {
        return {
            type: 'document',
            file,
            ...(params || {}),
        }
    }

    /**
     * Create an photo to be sent
     */
    export function photo(
        file: InputFileLike,
        params?: OmitTypeAndFile<InputMediaPhoto>
    ): InputMediaPhoto {
        return {
            type: 'photo',
            file,
            ...(params || {}),
        }
    }

    /**
     * Create an video to be sent
     */
    export function video(
        file: InputFileLike,
        params?: OmitTypeAndFile<InputMediaVideo>
    ): InputMediaVideo {
        return {
            type: 'video',
            file,
            ...(params || {}),
        }
    }

    /**
     * Create a voice message to be sent
     */
    export function voice(
        file: InputFileLike,
        params?: OmitTypeAndFile<InputMediaVoice>
    ): InputMediaVoice {
        return {
            type: 'voice',
            file,
            ...(params || {}),
        }
    }

    /**
     * Create a document to be sent, which subtype
     * is inferred automatically by file contents.
     *
     * **Does not** infer photos, they will be sent as simple files.
     */
    export function auto(
        file: InputFileLike,
        params?: OmitTypeAndFile<InputMediaAuto>
    ): InputMediaAuto {
        return {
            type: 'auto',
            file,
            ...(params || {}),
        }
    }
}
