import { tl } from '@mtcute/tl'
import { TelegramClient } from '../../client'
import { normalizeToInputUser } from '../../utils/peer-utils'

const empty: [string, undefined] = ['', undefined]

/** @internal */
export async function _parseEntities(
    this: TelegramClient,
    text?: string,
    mode?: string | null,
    entities?: tl.TypeMessageEntity[]
): Promise<[string, tl.TypeMessageEntity[] | undefined]> {
    if (!text) {
        return empty
    }

    if (entities) {
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

    if (mode === undefined) {
        mode = this._defaultParseMode
    }
    // either explicitly disabled or no available parser
    if (!mode) return [text, []]

    return this._parseModes[mode].parse(text)
}
