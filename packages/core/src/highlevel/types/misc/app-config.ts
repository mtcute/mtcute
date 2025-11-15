// This file is generated automatically, do not modify!

export interface AppConfigSchema {
  /**
   * <a href="https://corefork.telegram.org/api/animated-emojis">Animated
   * emojis</a> and
   * <a href="https://corefork.telegram.org/api/dice">animated
   * dice</a> should be scaled by this factor before being shown
   * to the user (float)
   */
  emojies_animated_zoom?: number
  /**
   * Whether app clients should start a keepalive service to keep
   * the app running and fetch updates even when the app is
   * closed (boolean)
   */
  keep_alive_service?: boolean
  /**
   * Whether app clients should start a background TCP connection
   * for MTProto update fetching (boolean)
   */
  background_connection?: boolean
  /**
   * A list of supported
   * <a href="https://corefork.telegram.org/api/dice">animated
   * dice</a> stickers (array of strings).
   */
  emojies_send_dice?: string[]
  /**
   * For
   * <a href="https://corefork.telegram.org/api/dice">animated
   * dice</a> emojis other than the basic <img class="emoji"
   * src="//telegram.org/img/emoji/40/F09F8EB2.png" width="20"
   * height="20" alt="🎲">, indicates the winning dice value and
   * the final frame of the animated sticker, at which to show
   * the fireworks <img class="emoji"
   * src="//telegram.org/img/emoji/40/F09F8E86.png" width="20"
   * height="20" alt="🎆"> (object with emoji keys and object
   * values, containing <code>value</code> and
   * <code>frame_start</code> float values)
   */
  emojies_send_dice_success?: Record<
    string,
    {
      value: number
      frame_start: number
    }
  >
  /**
   * A map of soundbites to be played when the user clicks on the
   * specified
   * <a href="https://corefork.telegram.org/api/animated-emojis">animated
   * emoji</a>; the
   * <a href="https://corefork.telegram.org/api/file_reference">file
   * reference field</a> should be base64-decoded before
   * <a href="https://corefork.telegram.org/api/files">downloading
   * the file</a> (map of
   * <a href="https://corefork.telegram.org/api/files">file
   * IDs</a> ({@link RawInputDocument}.id), with emoji string
   * keys)
   */
  emojies_sounds?: Record<
    string,
    {
      id: string
      access_hash: string
      file_reference_base64: string
    }
  >
  /**
   * Specifies the name of the service providing GIF search
   * through
   * <a href="#mtproto-configuration">gif_search_username</a>
   * (string)
   */
  gif_search_branding?: string
  /**
   * Specifies a list of emojis that should be suggested as
   * search term in a bar above the GIF search box (array of
   * string emojis)
   */
  gif_search_emojies?: string[]
  /**
   * Specifies that the app should not display
   * <a href="https://corefork.telegram.org/api/stickers#sticker-suggestions">local
   * sticker suggestions »</a> for emojis at all and just use the
   * result of {@link messages.RawGetStickersRequest} (bool)
   */
  stickers_emoji_suggest_only_api?: boolean
  /**
   * Specifies the validity period of the local cache of
   * {@link messages.RawGetStickersRequest}, also relevant when
   * generating the
   * <a href="https://corefork.telegram.org/api/offsets#hash-generation">pagination
   * hash</a> when invoking the method. (integer)
   */
  stickers_emoji_cache_time?: number
  /**
   * Whether the Settings-&gt;Devices menu should show an option
   * to scan a
   * <a href="https://corefork.telegram.org/api/qr-login">QR
   * login code</a> (boolean)
   */
  qr_login_camera?: boolean
  /**
   * Whether the login screen should show a
   * <a href="https://corefork.telegram.org/api/qr-login">QR code
   * login option</a>, possibly as default login method (string,
   * "disabled", "primary" or "secondary")
   */
  qr_login_code?: 'disabled' | 'primary' | 'secondary'
  /**
   * Whether clients should show an option for managing
   * <a href="https://corefork.telegram.org/api/folders">dialog
   * filters AKA folders</a> (boolean)
   */
  dialog_filters_enabled?: boolean
  /**
   * Whether clients should actively show a tooltip, inviting the
   * user to configure
   * <a href="https://corefork.telegram.org/api/folders">dialog
   * filters AKA folders</a>; typically this happens when the
   * chat list is long enough to start getting cluttered.
   * (boolean)
   */
  dialog_filters_tooltip?: boolean
  /**
   * Whether clients <em>can</em> invoke
   * {@link account.RawSetGlobalPrivacySettingsRequest} with
   * {@link RawGlobalPrivacySettings}, to automatically archive
   * and mute new incoming chats from non-contacts. (boolean)
   */
  autoarchive_setting_available?: boolean
  /**
   * Contains a list of suggestions that should be actively shown
   * as a tooltip to the user. (Array of strings, possible values
   * shown <a href="#suggestions">in the suggestions section
   * »</a>.
   */
  pending_suggestions?: string[]
  /**
   * Maximum number of
   * <a href="https://corefork.telegram.org/api/forum#forum-topics">topics</a>
   * that can be pinned in a single
   * <a href="https://corefork.telegram.org/api/forum">forum</a>.
   * (integer)
   */
  topics_pinned_limit?: number
  /**
   * The ID of the official
   * <a href="https://corefork.telegram.org/api/antispam">native
   * antispam bot</a>, that will automatically delete spam
   * messages if enabled as specified in the
   * <a href="https://corefork.telegram.org/api/antispam">native
   * antispam documentation »</a>.
   *
   *
   * When fetching the admin list of a supergroup using
   * {@link channels.RawGetParticipantsRequest}, if native
   * antispam functionality in the specified supergroup, the bot
   * should be manually added to the admin list displayed to the
   * user.  (numeric string that represents a Telegram user/bot
   * ID, should be casted to an int64)
   */
  telegram_antispam_user_id?: string
  /**
   * Minimum number of group members required to enable
   * <a href="https://corefork.telegram.org/api/antispam">native
   * antispam functionality</a>. (integer)
   */
  telegram_antispam_group_size_min?: number
  /**
   * List of phone number prefixes for anonymous
   * <a href="https://fragment.com/">Fragment</a> phone numbers.
   * (array of strings).
   */
  fragment_prefixes?: string[]
  /**
   * Minimum number of participants required to hide the
   * participants list of a supergroup using
   * {@link channels.RawToggleParticipantsHiddenRequest}.
   * (integer)
   */
  hidden_members_group_size_min?: number
  /**
   * A list of domains that support automatic login with manual
   * user confirmation,
   * <a href="https://corefork.telegram.org/api/url-authorization#link-url-authorization">click
   * here for more info on URL authorization »</a>. (array of
   * strings)
   */
  url_auth_domains?: string[]
  /**
   * A list of Telegram domains that support automatic login with
   * no user confirmation,
   * <a href="https://corefork.telegram.org/api/url-authorization#link-url-authorization">click
   * here for more info on URL authorization »</a>. (array of
   * strings)
   */
  autologin_domains?: string[]
  /**
   * A list of Telegram domains that can always be opened without
   * additional user confirmation, when clicking on in-app links
   * where the URL is not fully displayed (i.e.
   * {@link RawMessageEntityTextUrl} entities). (array of
   * strings)Note that when opening
   * <a href="https://corefork.telegram.org/api/links#named-mini-app-links">named
   * Mini App links</a> for the first time, confirmation should
   * still be requested from the user, even if the domain of the
   * containing deep link is whitelisted (i.e.
   * <code>t.me/&lt;bot_username&gt;/&lt;short_name&gt;?startapp=&lt;start_parameter&gt;</code>,
   * where <code>t.me</code> is whitelisted).  Confirmation
   * should <strong>always</strong> be asked, even if we already
   * opened the
   * <a href="https://corefork.telegram.org/api/links#named-mini-app-links">named
   * Mini App</a> before, if the link is not visible (i.e.
   * {@link RawMessageEntityTextUrl} text links, inline buttons
   * etc.).
   */
  whitelisted_domains?: string[]
  /**
   * Contains a set of recommended codec parameters for round
   * videos.  (object, as described in the example)
   */
  round_video_encoding?: {
    diameter: number
    video_bitrate: number
    audio_bitrate: number
    max_size: number
  }
  /**
   * Per-user read receipts, fetchable using
   * {@link messages.RawGetMessageReadParticipantsRequest}, will
   * be available in groups with an amount of participants less
   * or equal to <code>chat_read_mark_size_threshold</code>.
   * (integer)
   */
  chat_read_mark_size_threshold?: number
  /**
   * To protect user privacy, read receipts for chats are only
   * stored for <code>chat_read_mark_expire_period</code> seconds
   * after the message was sent. (integer)
   */
  chat_read_mark_expire_period?: number
  /**
   * To protect user privacy, read receipts for private chats are
   * only stored for <code>pm_read_date_expire_period</code>
   * seconds after the message was sent. (integer)
   */
  pm_read_date_expire_period?: number
  /**
   * Maximum number of participants in a group call (livestreams
   * allow ∞ participants) (integer)
   */
  groupcall_video_participants_max?: number
  /**
   * Maximum number of unique reactions for any given message:
   * for example, if there are 2000 <img class="emoji"
   * src="//telegram.org/img/emoji/40/F09F918D.png" width="20"
   * height="20" alt="👍"> and 1000 custom emoji <img
   * class="emoji" src="//telegram.org/img/emoji/40/F09F9881.png"
   * width="20" height="20" alt="😁"> reactions and
   * reactions_uniq_max = 2, you can't add a <img class="emoji"
   * src="//telegram.org/img/emoji/40/F09F918E.png" width="20"
   * height="20" alt="👎"> reaction, because that would raise the
   * number of unique reactions to 3 &gt; 2. (integer)
   */
  reactions_uniq_max?: number
  /**
   * Maximum number of reactions that can be marked as allowed in
   * a chat using {@link RawChatReactionsSome}. (integer)
   */
  reactions_in_chat_max?: number
  /**
   * Maximum number of reactions that can be added to a single
   * message by a non-Premium user. (integer)
   */
  reactions_user_max_default?: number
  /**
   * Maximum number of reactions that can be added to a single
   * message by a Premium user. (integer)
   */
  reactions_user_max_premium?: number
  /**
   * Default emoji status stickerset ID. (integer)
   *
   *
   * Note that the stickerset can be fetched using
   * {@link RawInputStickerSetEmojiDefaultStatuses}.
   */
  default_emoji_statuses_stickerset_id?: number
  /**
   * The maximum duration in seconds of
   * <a href="https://corefork.telegram.org/api/ringtones">uploadable
   * notification sounds »</a> (integer)
   */
  ringtone_duration_max?: number
  /**
   * The maximum post-conversion size in bytes of
   * <a href="https://corefork.telegram.org/api/ringtones">uploadable
   * notification sounds »</a>
   */
  ringtone_size_max?: number
  /**
   * The maximum number of
   * <a href="https://corefork.telegram.org/api/ringtones">saveable
   * notification sounds »</a>
   */
  ringtone_saved_count_max?: number
  /**
   * The maximum number of
   * <a href="https://corefork.telegram.org/api/custom-emoji">custom
   * emojis</a> that may be present in a message. (integer)
   */
  message_animated_emoji_max?: number
  /**
   * Defines how many
   * <a href="https://corefork.telegram.org/api/premium">Premium
   * stickers</a> to show in the sticker suggestion popup when
   * entering an emoji into the text field, see the
   * <a href="https://corefork.telegram.org/api/stickers#sticker-suggestions">sticker
   * docs for more info</a> (integer, defaults to 0)
   */
  stickers_premium_by_emoji_num?: number
  /**
   * For
   * <a href="https://corefork.telegram.org/api/premium">Premium
   * users</a>, used to define the suggested sticker list, see
   * the
   * <a href="https://corefork.telegram.org/api/stickers#sticker-suggestions">sticker
   * docs for more info</a> (integer, defaults to 2)
   */
  stickers_normal_by_emoji_per_premium_num?: number
  /**
   * The user can't purchase
   * <a href="https://corefork.telegram.org/api/premium">Telegram
   * Premium</a>. The app must also hide all Premium features,
   * including stars for other users, et cetera. (boolean)
   */
  premium_purchase_blocked?: boolean
  /**
   * The maximum number of
   * <a href="https://corefork.telegram.org/api/channel">channels
   * and supergroups</a> a
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may join (integer)
   */
  channels_limit_default?: number
  /**
   * The maximum number of
   * <a href="https://corefork.telegram.org/api/channel">channels
   * and supergroups</a> a
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may join (integer)
   */
  channels_limit_premium?: number
  /**
   * The maximum number of GIFs a
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may save (integer)
   */
  saved_gifs_limit_default?: number
  /**
   * The maximum number of GIFs a
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may save (integer)
   */
  saved_gifs_limit_premium?: number
  /**
   * The maximum number of stickers a
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may
   * <a href="https://corefork.telegram.org/api/stickers#favorite-stickersets">add
   * to Favorites »</a> (integer)
   */
  stickers_faved_limit_default?: number
  /**
   * The maximum number of stickers a
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may
   * <a href="https://corefork.telegram.org/api/stickers#favorite-stickersets">add
   * to Favorites »</a> (integer)
   */
  stickers_faved_limit_premium?: number
  /**
   * The maximum number of
   * <a href="https://corefork.telegram.org/api/folders">folders</a>
   * a
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may create (integer)
   */
  dialog_filters_limit_default?: number
  /**
   * The maximum number of
   * <a href="https://corefork.telegram.org/api/folders">folders</a>
   * a
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may create (integer)
   */
  dialog_filters_limit_premium?: number
  /**
   * The maximum number of chats a
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may add to a
   * <a href="https://corefork.telegram.org/api/folders">folder</a>
   * (integer)
   */
  dialog_filters_chats_limit_default?: number
  /**
   * The maximum number of chats a
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may add to a
   * <a href="https://corefork.telegram.org/api/folders">folder</a>
   * (integer)
   */
  dialog_filters_chats_limit_premium?: number
  /**
   * The maximum number of chats a
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may pin (integer)
   */
  dialogs_pinned_limit_default?: number
  /**
   * The maximum number of chats a
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may pin (integer)
   */
  dialogs_pinned_limit_premium?: number
  /**
   * The maximum number of chats a
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may pin in a folder (integer)
   */
  dialogs_folder_pinned_limit_default?: number
  /**
   * The maximum number of chats a
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may pin in a folder (integer)
   */
  dialogs_folder_pinned_limit_premium?: number
  /**
   * The maximum number of public
   * <a href="https://corefork.telegram.org/api/channel">channels
   * or supergroups</a> a
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may create (integer)
   */
  channels_public_limit_default?: number
  /**
   * The maximum number of public
   * <a href="https://corefork.telegram.org/api/channel">channels
   * or supergroups</a> a
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * user may create (integer)
   */
  channels_public_limit_premium?: number
  /**
   * The maximum UTF-8 length of media captions sendable by
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users (integer)
   */
  caption_length_limit_default?: number
  /**
   * The maximum UTF-8 length of media captions sendable by
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users (integer)
   */
  caption_length_limit_premium?: number
  /**
   * The maximum number of file parts uploadable by
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users (integer, the maximum file size can be extrapolated by
   * multiplying this value by <code>524288</code>, the biggest
   * possible chunk size)
   */
  upload_max_fileparts_default?: number
  /**
   * The maximum number of file parts uploadable by
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users (integer, the maximum file size can be extrapolated by
   * multiplying this value by <code>524288</code>, the biggest
   * possible chunk size)
   */
  upload_max_fileparts_premium?: number
  /**
   * The maximum UTF-8 length of bios of
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users (integer)
   */
  about_length_limit_default?: number
  /**
   * The maximum UTF-8 length of bios of
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users (integer)
   */
  about_length_limit_premium?: number
  /**
   * Array of string identifiers, indicating the order of
   * <a href="https://corefork.telegram.org/api/premium">Telegram
   * Premium</a> features in the Telegram Premium promotion
   * popup,
   * <a href="https://corefork.telegram.org/api/premium#telegram-premium-features">see
   * here for the possible values »</a>
   */
  premium_promo_order?: string[]
  /**
   * Contains the username of the official
   * <a href="https://corefork.telegram.org/api/premium">Telegram
   * Premium</a> bot that may be used to buy a
   * <a href="https://corefork.telegram.org/api/premium">Telegram
   * Premium</a> subscription, see
   * <a href="https://corefork.telegram.org/api/premium">here for
   * detailed instructions »</a> (string)
   */
  premium_bot_username?: string
  /**
   * Contains an
   * <a href="https://corefork.telegram.org/api/payments">invoice
   * slug</a> that may be used to buy a
   * <a href="https://corefork.telegram.org/api/premium">Telegram
   * Premium</a> subscription, see
   * <a href="https://corefork.telegram.org/api/premium">here for
   * detailed instructions »</a> (string)
   */
  premium_invoice_slug?: string
  /**
   * Whether a gift icon should be shown in the attachment menu
   * in private chats with users, offering the current user to
   * gift a
   * <a href="https://corefork.telegram.org/api/premium">Telegram
   * Premium</a> subscription to the other user in the chat.
   * (boolean)
   */
  premium_gift_attach_menu_icon?: boolean
  /**
   * Whether a gift icon should be shown in the text bar in
   * private chats with users (ie like the <code>/</code> icon in
   * chats with bots), offering the current user to gift a
   * <a href="https://corefork.telegram.org/api/premium">Telegram
   * Premium</a> subscription to the other user in the chat. Can
   * only be true if <code>premium_gift_attach_menu_icon</code>
   * is also true. (boolean)
   */
  premium_gift_text_field_icon?: boolean
  /**
   * Users that import a folder using a
   * <a href="https://corefork.telegram.org/api/links#chat-folder-links">chat
   * folder deep link »</a> should retrieve additions made to the
   * folder by invoking
   * {@link chatlists.RawGetChatlistUpdatesRequest} at most every
   * <code>chatlist_update_period</code> seconds. (integer)
   */
  chatlist_update_period?: number
  /**
   * Maximum number of per-folder
   * <a href="https://corefork.telegram.org/api/links#chat-folder-links">chat
   * folder deep links »</a> that can be created by
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  chatlist_invites_limit_default?: number
  /**
   * Maximum number of per-folder
   * <a href="https://corefork.telegram.org/api/links#chat-folder-links">chat
   * folder deep links »</a> that can be created by
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  chatlist_invites_limit_premium?: number
  /**
   * Maximum number of
   * <a href="https://corefork.telegram.org/api/links#chat-folder-links">shareable
   * folders</a>
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users may have. (integer)
   */
  chatlists_joined_limit_default?: number
  /**
   * Maximum number of
   * <a href="https://corefork.telegram.org/api/links#chat-folder-links">shareable
   * folders</a>
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users may have. (integer)
   */
  chatlists_joined_limit_premium?: number
  /**
   * A soft limit, specifying the maximum number of files that
   * should be downloaded in parallel from the same DC, for files
   * smaller than 20MB. (integer)
   */
  small_queue_max_active_operations_count?: number
  /**
   * A soft limit, specifying the maximum number of files that
   * should be downloaded in parallel from the same DC, for files
   * bigger than 20MB. (integer)
   */
  large_queue_max_active_operations_count?: number
  /**
   * An
   * <a href="https://corefork.telegram.org/api/auth#confirming-login">unconfirmed
   * session »</a> will be autoconfirmed this many seconds after
   * login. (integer)
   */
  authorization_autoconfirm_period?: number
  /**
   * The exact list of users that viewed the story will be hidden
   * from the poster this many seconds after the story expires.
   * (integer)This limit applies <strong>only</strong> to
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users,
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users can <strong>always</strong> access the viewer list.
   */
  story_viewers_expire_period?: number
  /**
   * The maximum number of active
   * <a href="https://corefork.telegram.org/api/stories">stories</a>
   * for
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users (integer).
   */
  story_expiring_limit_default?: number
  /**
   * The maximum number of active
   * <a href="https://corefork.telegram.org/api/stories">stories</a>
   * for
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users (integer).
   */
  story_expiring_limit_premium?: number
  /**
   * The maximum UTF-8 length of story captions for
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  story_caption_length_limit_premium?: number
  /**
   * The maximum UTF-8 length of story captions for
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  story_caption_length_limit_default?: number
  /**
   * Indicates whether users can post stories. (string)One of:
   * <li><code>enabled</code> - Any user can post stories.</li>
   * <li><code>premium</code> - Only users with a
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * subscription can post stories.</li>
   * <li><code>disabled</code> - Users can't post stories.</li>
   *
   */
  stories_posting?: string
  /**
   * Enabling
   * <a href="https://corefork.telegram.org/api/stories#stealth-mode">stories
   * stealth mode</a> with the <code>past</code> flag will erase
   * views of any story opened in the past
   * <code>stories_stealth_past_period</code> seconds. (integer)
   */
  stories_stealth_past_period?: number
  /**
   * Enabling
   * <a href="https://corefork.telegram.org/api/stories#stealth-mode">stories
   * stealth mode</a> with the <code>future</code> flag will hide
   * views of any story opened in the next
   * <code>stories_stealth_future_period</code> seconds.
   * (integer)
   */
  stories_stealth_future_period?: number
  /**
   * After enabling
   * <a href="https://corefork.telegram.org/api/stories#stealth-mode">stories
   * stealth mode</a>, this many seconds must elapse before the
   * user is allowed to enable it again. (integer)
   */
  stories_stealth_cooldown_period?: number
  /**
   * Maximum number of stories that can be sent in a week by
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  stories_sent_weekly_limit_default?: number
  /**
   * Maximum number of stories that can be sent in a week by
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  stories_sent_weekly_limit_premium?: number
  /**
   * Maximum number of stories that can be sent in a month by
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  stories_sent_monthly_limit_default?: number
  /**
   * Maximum number of stories that can be sent in a month by
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  stories_sent_monthly_limit_premium?: number
  /**
   * Maximum number of
   * <a href="https://corefork.telegram.org/api/stories#media-areas">story
   * reaction media areas »</a> that can be added to a story by
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  stories_suggested_reactions_limit_default?: number
  /**
   * Maximum number of
   * <a href="https://corefork.telegram.org/api/stories#media-areas">story
   * reaction media areas »</a> that can be added to a story by
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  stories_suggested_reactions_limit_premium?: number
  /**
   * Username of the inline bot to use to generate venue location
   * tags for stories, see
   * <a href="https://corefork.telegram.org/api/stories#location-tags">here
   * »</a> for more info. (string)
   */
  stories_venue_search_username?: string
  /**
   * ID of the official Telegram user that will post stories
   * about new Telegram features: stories posted by this user
   * should be shown on the
   * <a href="https://corefork.telegram.org/api/stories#watching-stories">active
   * or active and hidden stories bar</a> just like for contacts,
   * even if the user was removed from the contact list.
   * (integer, defaults to <code>777000</code>)
   */
  stories_changelog_user_id?: number
  /**
   * Whether
   * <a href="https://corefork.telegram.org/api/entities">styled
   * text entities</a> and links in story text captions can be
   * used by all users (<code>enabled</code>), only
   * [Premium](/api/premium users) (<code>premium</code>), or no
   * one (<code>disabled</code>). (string)This field is used both
   * when posting stories, to indicate to the user whether they
   * can use entities, and when viewing stories, to hide entities
   * (client-side) on stories posted by users whose
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * subscription has expired (if <code>stories_entities ==
   * "premium"</code> and {@link RawUser}.<code>premium</code> is
   * not set, or if <code>stories_entities == "disabled"</code>).
   *
   */
  stories_entities?: string
  /**
   * Whether
   * <a href="https://corefork.telegram.org/api/giveaways">giveaways</a>
   * can be started by the current user. (boolean)
   */
  giveaway_gifts_purchase_available?: boolean
  /**
   * The maximum number of users that can be specified when
   * making a
   * <a href="https://corefork.telegram.org/api/giveaways">direct
   * giveaway</a>. (integer)
   */
  giveaway_add_peers_max?: number
  /**
   * The maximum number of countries that can be specified when
   * restricting the set of participating countries in a
   * <a href="https://corefork.telegram.org/api/giveaways">giveaway</a>.
   *  (itneger)
   */
  giveaway_countries_max?: number
  /**
   * The number of
   * <a href="https://corefork.telegram.org/api/boost">boosts</a>
   * that will be gained by a channel for each winner of a
   * <a href="https://corefork.telegram.org/api/giveaways">giveaway</a>.
   * (integer)
   */
  giveaway_boosts_per_premium?: number
  /**
   * The maximum duration in seconds of a
   * <a href="https://corefork.telegram.org/api/giveaways">giveaway</a>.
   * (integer)
   */
  giveaway_period_max?: number
  /**
   * Maximum
   * <a href="https://corefork.telegram.org/api/boost">boost
   * level</a> for channels. (integer)
   */
  boosts_channel_level_max?: number
  /**
   * The number of additional
   * <a href="https://corefork.telegram.org/api/boost">boost
   * slots</a> that the current user will receive when
   * <a href="https://corefork.telegram.org/api/premium#gifting-telegram-premium">gifting
   * a Telegram Premium subscription</a>.
   */
  boosts_per_sent_gift?: number
  /**
   * The maximum number of
   * <a href="https://corefork.telegram.org/api/transcribe">speech
   * recognition »</a> calls per week for
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  transcribe_audio_trial_weekly_number?: number
  /**
   * The maximum allowed duration of media in seconds for
   * <a href="https://corefork.telegram.org/api/transcribe">speech
   * recognition »</a> for
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  transcribe_audio_trial_duration_max?: number
  /**
   * The maximum number of similar channels that can be
   * recommended by
   * {@link channels.RawGetChannelRecommendationsRequest} to
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  recommended_channels_limit_default?: number
  /**
   * The maximum number of similar channels that can be
   * recommended by
   * {@link channels.RawGetChannelRecommendationsRequest} to
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users. (integer)
   */
  recommended_channels_limit_premium?: number
  /**
   * Maximum UTF-8 length of {@link RawInputReplyToMessage}.
   * (integer)
   */
  quote_length_max?: number
  /**
   * After reaching at least this
   * <a href="https://corefork.telegram.org/api/boost">boost
   * level »</a>, channels gain the ability to change their
   * <a href="https://corefork.telegram.org/api/colors">message
   * accent palette emoji »</a>.  (integer)
   */
  channel_bg_icon_level_min?: number
  /**
   * After reaching at least this
   * <a href="https://corefork.telegram.org/api/boost">boost
   * level »</a>, channels gain the ability to change their
   * <a href="https://corefork.telegram.org/api/colors">profile
   * accent palette emoji »</a>.  (integer)
   */
  channel_profile_bg_icon_level_min?: number
  /**
   * After reaching at least this
   * <a href="https://corefork.telegram.org/api/boost">boost
   * level »</a>, channels gain the ability to change their
   * <a href="https://corefork.telegram.org/api/emoji-status">status
   * emoji »</a>.  (integer)
   */
  channel_emoji_status_level_min?: number
  /**
   * After reaching at least this
   * <a href="https://corefork.telegram.org/api/boost">boost
   * level »</a>, channels gain the ability to set a
   * <a href="https://corefork.telegram.org/api/wallpapers#channel-wallpapers">fill
   * channel wallpaper, see here » for more info</a>.  (integer)
   */
  channel_wallpaper_level_min?: number
  /**
   * After reaching at least this
   * <a href="https://corefork.telegram.org/api/boost">boost
   * level »</a>, channels gain the ability to set any custom
   * <a href="https://corefork.telegram.org/api/wallpapers">wallpaper</a>,
   * not just
   * <a href="https://corefork.telegram.org/api/wallpapers">fill
   * channel wallpapers, see here » for more info</a>.  (integer)
   */
  channel_custom_wallpaper_level_min?: number
  /**
   * Maximum number of pinned dialogs in
   * <a href="https://corefork.telegram.org/api/saved-messages">saved
   * messages</a> for
   * non-<a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users.  (integer)
   */
  saved_dialogs_pinned_limit_default?: number
  /**
   * Maximum number of pinned dialogs in
   * <a href="https://corefork.telegram.org/api/saved-messages">saved
   * messages</a> for
   * <a href="https://corefork.telegram.org/api/premium">Premium</a>
   * users.  (integer)
   */
  saved_dialogs_pinned_limit_premium?: number
  [key: string]: unknown
}
