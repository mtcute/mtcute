import { tl } from '@mtcute/tl'
import { Photo } from './photo'
import { TelegramClient } from '../../client'
import { RawDocument } from './document'
import { parseDocument } from './document-utils'
import { makeInspectable } from '../utils'
import { MtArgumentError } from '../errors'

/**
 * Web page preview.
 *
 * **Warning**: Documentation of this class also contains my
 * personal research about how Telegram
 * handles different pages and embeds. **By no means**
 * this should be considered the definitive source of truth,
 * as this is not documented officially, and only consists
 * of my own observations and experiments.
 */
export class WebPage {
    readonly type = 'web_page' as const

    constructor(readonly client: TelegramClient, readonly raw: tl.RawWebPage) {}

    /**
     * Unique ID of the preview
     */
    get id(): tl.Long {
        return this.raw.id
    }

    /**
     * Original page URL
     */
    get url(): string {
        return this.raw.url
    }

    /**
     * URL to be displayed to the user.
     *
     * Usually a normal URL with stripped protocol and garbage.
     */
    get displayUrl(): string {
        return this.raw.displayUrl
    }

    /**
     * Type of the preview, taken directly from TL object
     *
     * Officially documented are:
     * `article, photo, audio, video, document, profile, app`,
     * but also these are encountered:
     * `telegram_user, telegram_bot, telegram_channel, telegram_megagroup`:
     *
     * - `telegram_*` ones seem to be used for `t.me` links.
     * - `article` seems to be used for almost all custom pages with `og:*` tags
     * - `photo`, `audio` and `video` seem to be derived from `og:type`,
     *    and the page itself may contain a preview photo and an embed link
     *    for the player. This may not correctly represent actual content type:
     *    Spotify links are `audio`, but SoundCloud are `video`. YouTube links are `video`,
     *    but tweets with video are `photo`.
     * - `document` seem to be used for files downloadable directly from the URL,
     *    like PDFs, audio files, videos, etc. {@link document} seem to be
     *    present if `type` is `document`.
     * - `profile` doesn't seem to be used
     * - `app` doesn't seem to be used
     *
     * `unknown` is returned if no type is returned in the TL object.
     */
    get previewType(): string {
        return this.raw.type || 'unknown'
    }

    /**
     * Page title
     *
     * Usually defined by `og:site_name` meta tag or website domain
     */
    get siteName(): string | null {
        return this.raw.siteName ?? null
    }

    /**
     * Page title
     *
     * Usually defined by `og:title` meta tag or `<title>` tag
     */
    get title(): string | null {
        return this.raw.title ?? null
    }

    /**
     * Page description
     *
     * Usually defined by `description` or `og:description` meta tag
     */
    get description(): string | null {
        return this.raw.description ?? null
    }

    /**
     * Page author
     *
     * The source for this is unknown, seems to be
     * custom-made for services like Twitter.
     *
     * In official apps this seems to be used as a fallback for description.
     */
    get author(): string | null {
        return this.raw.author ?? null
    }

    /**
     * The embed URL.
     *
     * Based on my research, Telegram only allows
     * embedding pages from a server-side white-list of domains.
     *
     * That is, you can't just copy-paste meta tags
     * from YouTube to your own domain and expect Telegram
     * to return a webpage with embed.
     *
     * IDK why is that, maybe they are concerned about
     * leaking users' IPs to 3rd parties or something
     * (but why allow embedding in the first place then?)
     *
     * Telegram for Android does not show "play" button for
     * webpages without embeds, and instead treats it like a simple
     * photo (why?).
     *
     * TDesktop does not support embeds and seems
     * to use {@link type} to determine them, and specifically
     * [checks](https://github.com/telegramdesktop/tdesktop/blob/3343880ed0e5a86accc7334af54b3470e29ee686/Telegram/SourceFiles/history/view/media/history_view_web_page.cpp#L561)
     * for `YouTube` in {@link siteName} to display YouTube icon.
     */
    get embedUrl(): string | null {
        return this.raw.embedUrl ?? null
    }

    /**
     * Embed type.
     *
     * Now this is actually stupid.
     * As per [official documentation](https://core.telegram.org/constructor/webPage),
     * `embed_type` contains «MIME type of the embedded preview, (e.g., text/html or video/mp4)».
     * But in fact every time I encountered it it contained a simple string `iframe`.
     *
     * I couldn't find any usage of this field in official apps either.
     */
    get embedType(): string | null {
        return this.raw.embedType ?? null
    }

    /**
     * Width of the embed in pixels, 0 if not available.
     */
    get embedWidth(): number {
        return this.raw.embedWidth || 0
    }

    /**
     * Height of the embed in pixels, 0 if not available.
     */
    get embedHeight(): number {
        return this.raw.embedHeight || 0
    }

    private _photo?: Photo | null
    /**
     * A photo inside this webpage preview.
     *
     * Used for most of the preview types.
     */
    get photo(): Photo | null {
        if (this._photo === undefined) {
            if (this.raw.photo?._ !== 'photo') {
                this._photo = null
            } else {
                this._photo = new Photo(this.client, this.raw.photo)
            }
        }

        return this._photo
    }

    private _document?: RawDocument | null
    /**
     * Document inside this webpage preview.
     *
     * Seems that this is only used for `document` previews.
     *
     * Can be a {@link Animation}, {@link Photo}, {@link Video},
     * {@link Audio}, {@link Document}.
     */
    get document(): RawDocument | null {
        if (this._document === undefined) {
            if (this.raw.document?._ !== 'document') {
                this._document = null
            } else {
                this._document = parseDocument(this.client, this.raw.document)
            }
        }

        return this._document
    }

    /**
     * Input media TL object generated from this object,
     * to be used inside {@link InputMediaLike} and
     * {@link TelegramClient.sendMedia}.
     *
     * WebPage can't provide an input media, since some
     * can only be auto-generated from a link. This getter
     * is only provided to allow using `msg.media.inputMedia`
     */
    get inputMedia(): tl.TypeInputMedia {
        throw new MtArgumentError('WebPage cannot provide an InputMedia')
    }
}

makeInspectable(WebPage, undefined, ['inputMedia'])
