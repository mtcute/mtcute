import { tl } from '@mtcute/tl'
import { Photo } from './photo'
import { Video } from './video'
import { TelegramClient } from '../../client'
import { makeInspectable } from '../utils'

export class Game {
    readonly type = 'game' as const

    readonly game: tl.RawGame
    readonly client: TelegramClient

    constructor(client: TelegramClient, game: tl.RawGame) {
        this.client = client
        this.game = game
    }

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

    private _photo?: Photo
    /**
     * Photo that will be displayed in the game message in chats
     */
    get photo(): Photo | null {
        if (this.game.photo._ === 'photoEmpty') return null

        if (!this._photo) {
            this._photo = new Photo(this.client, this.game.photo)
        }

        return this._photo
    }

    private _animation?: Video | null
    /**
     * Animation that will be displayed in the game message in chats
     */
    get animation(): Video | null {
        if (this.game.document?._ !== 'document') return null

        if (this._animation === undefined) {
            const attr = this.game.document.attributes.find(
                (it) => it._ === 'documentAttributeVideo'
            ) as tl.RawDocumentAttributeVideo | undefined
            if (!attr) {
                this._animation = null
            } else {
                this._animation = new Video(
                    this.client,
                    this.game.document,
                    attr
                )
            }
        }

        return this._animation
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

makeInspectable(Game, undefined, ['inputMedia'])
