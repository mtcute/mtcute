import { tl } from '@mtcute/core'

import { makeInspectable } from '../../utils'
import { MessageEntity } from '../messages'

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
        return (this._entities ??= this.tos.entities.map((it) => new MessageEntity(it, this.tos.text)))
    }
}

makeInspectable(TermsOfService)
