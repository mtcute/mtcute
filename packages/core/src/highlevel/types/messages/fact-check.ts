import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { MessageEntity } from './message-entity.js'

/**
 * Describes a fact-check added to the message by an independent checker
 */
export class FactCheck {
    constructor(readonly raw: tl.RawFactCheck) {}

    /**
     * Text of the fact-check
     */
    get text(): string {
        return this.raw.text?.text ?? ''
    }

    /**
     * Entities contained in the fact-check text
     */
    get entities(): MessageEntity[] {
        const entities: MessageEntity[] = []

        if (this.raw.text?.entities) {
            for (const ent of this.raw.text.entities) {
                entities.push(new MessageEntity(ent, this.raw.text.text))
            }
        }

        return entities
    }

    /**
     * Country for which the fact-check is relevant
     */
    get country(): string | null {
        return this.raw.country ?? null
    }

    /**
     * Whether this information might be outdated
     * and should be re-fetched manually
     */
    get shouldRecheck(): boolean {
        return this.raw.needCheck!
    }

    /**
     * Hash of the fact-check
     */
    get hash(): tl.Long {
        return this.raw.hash
    }
}

memoizeGetters(FactCheck, ['entities'])
makeInspectable(FactCheck)
