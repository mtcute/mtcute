import { tl } from '@mtcute/tl'

import { MessageEntity } from '../messages'
import { makeInspectable } from '../utils'

/**
 * Telegram's Terms of Service returned by {@link TelegramClient.signIn}
 */
export class TermsOfService {
    /**
     * Underlying raw TL object
     */
    readonly tos: tl.help.TypeTermsOfService

    constructor(obj: tl.help.TypeTermsOfService) {
        this.tos = obj
    }

    /**
     * Terms of Service identifier
     */
    get id(): string {
        return this.tos.id.data
    }

    /**
     * Terms of Service text
     */
    get text(): string {
        return this.tos.text
    }

    private _entities?: MessageEntity[]

    /**
     * Terms of Service entities text
     */
    get entities(): ReadonlyArray<MessageEntity> {
        return (this._entities ??= this.tos.entities
            .map((it) => MessageEntity._parse(it))
            .filter((it) => it !== null) as MessageEntity[])
    }
}

makeInspectable(TermsOfService)
