import type { tl } from '@mtcute/tl'
import { makeInspectable } from '../../utils/inspectable.js'

/** Information about a bot-issued verification */
export class BotVerification {
    constructor(readonly raw: tl.RawBotVerification) {}

    /** ID of the bot which has verified this user */
    get botId(): number {
        return this.raw.botId
    }

    /** ID of the custom emoji to display */
    get emojiId(): tl.Long {
        return this.raw.icon
    }

    /** Description of the verification */
    get description(): string {
        return this.raw.description
    }
}

makeInspectable(BotVerification)
