import type { tl } from '@mtcute/tl'
import type { Video } from '../media/video.js'
import { asNonNull } from '@fuman/utils'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parseDocument } from '../media/document-utils.js'
import { Photo } from '../media/photo.js'

/** Information about a bot */
export class BotInfo {
    constructor(readonly raw: tl.RawBotInfo) {}

    /** Whether the bot has preview medias available */
    get hasPreviewMedia(): boolean {
        return this.raw.hasPreviewMedias!
    }

    /** ID of the bot */
    get id(): number {
        return asNonNull(this.raw.userId)
    }

    get description(): string {
        return this.raw.description ?? ''
    }

    get descriptionPhoto(): Photo | null {
        if (!this.raw.descriptionPhoto || this.raw.descriptionPhoto._ !== 'photo') return null

        return new Photo(this.raw.descriptionPhoto)
    }

    get descriptionVideo(): Video | null {
        if (!this.raw.descriptionDocument || this.raw.descriptionDocument._ !== 'document') return null

        const parsed = parseDocument(this.raw.descriptionDocument)
        if (parsed.type !== 'video') return null

        return parsed
    }

    /** List of the bot's registered commands */
    get commands(): tl.TypeBotCommand[] {
        return this.raw.commands ?? []
    }

    /** Action to be performed when the bot's menu button is pressed */
    get menuButton(): tl.TypeBotMenuButton | null {
        return this.raw.menuButton ?? null
    }

    /** URL of the bot's privacy policy */
    get privacyPolicyUrl(): string | null {
        return this.raw.privacyPolicyUrl ?? null
    }

    get verifierSettings(): tl.TypeBotVerifierSettings | null {
        return this.raw.verifierSettings ?? null
    }
}

makeInspectable(BotInfo)
memoizeGetters(BotInfo, ['descriptionPhoto', 'descriptionVideo'])
