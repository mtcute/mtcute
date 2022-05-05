import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { normalizeToInputUser } from '../../utils/peer-utils'
import { FormattedString, MtClientError } from '../../types'

const empty: [string, undefined] = ['', undefined]

/** @internal */
export async function _parseEntities(
    this: TelegramClient,
    text?: string | FormattedString<any>,
    mode?: string | null,
    entities?: tl.TypeMessageEntity[]
): Promise<[string, tl.TypeMessageEntity[] | undefined]> {
    if (!text) {
        return empty
    }

    if (typeof text === 'object') {
        mode = text.mode
        text = text.value
    }

    if (!entities) {
        if (mode === undefined) {
            mode = this._defaultParseMode
        }
        // either explicitly disabled or no available parser
        if (!mode) return [text, []]

        if (!(mode in this._parseModes)) {
            throw new MtClientError(`Parse mode ${mode} is not registered.`)
        }

        ;[text, entities] = await this._parseModes[mode].parse(text)
    }

    // replace mentionName entities with input ones
    for (const ent of entities) {
        if (ent._ === 'messageEntityMentionName') {
            try {
                const inputPeer = normalizeToInputUser(
                    await this.resolvePeer(ent.userId)
                )

                // not a user
                if (!inputPeer) continue
                ;(ent as any)._ = 'inputMessageEntityMentionName'
                ;(ent as any).userId = inputPeer
            } catch (e) {}
        }
    }

    return [text, entities]
}
