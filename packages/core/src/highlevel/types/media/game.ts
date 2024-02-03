import { tl } from '@mtcute/tl'

import { makeInspectable } from '../../utils/index.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Photo } from './photo.js'
import { Video } from './video.js'

export class Game {
    readonly type = 'game' as const

    constructor(readonly game: tl.RawGame) {}

    /**
     * Unique identifier of the game.
     */
    get id(): tl.Long {
        return this.game.id
    }

    /**
     * Title of the game
     */
    get title(): string {
        return this.game.title
    }

    /**
     * Description of the game
     */
    get description(): string {
        return this.game.description
    }

    /**
     * Unique short name of the game
     */
    get shortName(): string {
        return this.game.shortName
    }

    /**
     * Photo that will be displayed in the game message in chats
     */
    get photo(): Photo | null {
        if (this.game.photo._ === 'photoEmpty') return null

        return new Photo(this.game.photo)
    }

    /**
     * Animation that will be displayed in the game message in chats
     */
    get animation(): Video | null {
        if (this.game.document?._ !== 'document') return null

        const attr = this.game.document.attributes.find((it) => it._ === 'documentAttributeVideo') as
            | tl.RawDocumentAttributeVideo
            | undefined

        if (!attr) {
            return null
        }

        return new Video(this.game.document, attr)
    }

    /**
     * Input media TL object generated from this object,
     * to be used inside {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}
     */
    get inputMedia(): tl.TypeInputMedia {
        return {
            _: 'inputMediaGame',
            id: {
                _: 'inputGameID',
                id: this.game.id,
                accessHash: this.game.accessHash,
            },
        }
    }
}

memoizeGetters(Game, ['photo', 'animation'])
makeInspectable(Game, undefined, ['inputMedia'])
