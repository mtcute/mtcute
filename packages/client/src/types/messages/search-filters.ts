import { tl } from '@mtcute/tl'

/**
 * Search filters to be used in {@link TelegramClient.searchMessages}
 * and {@link TelegramClient.searchGlobal}.
 *
 * Note that due to Telegram API limitations, you can't combine filters,
 * and can only use a limited pre-defined set.
 *
 * This object simply exports static TL objects for convenience,
 * if it does not expose something, simply pass a TL object
 * directly.
 *
 *  - `Empty`: Search for all messages (used by default)
 *  - `Photo`: Search for photos
 *  - `Video`: Search for videos
 *  - `PhotoAndVideo`: Search for photos and videos
 *  - `Document`: Search for documents (generic files, not including audio, video, etc.)
 *  - `Url`: Search for messages containing URLs and text links
 *  - `Gif`: Search for messages containing GIFs
 *  - `Voice`: Search for messages containing voice notes
 *  - `Audio`: Search for messages containing audio files
 *  - `ChatPhotoChange`: Search for chat photo changes
 *  - `Call`: Search for calls
 *  - `Round`: Search for round messages (aka video notes)
 *  - `RoundAndVoice`: Search for round messages (aka video notes) and voice notes
 *  - `MyMention`: Search for mentions of yourself
 *  - `Location`: Search for geolocations
 *  - `Contact`: Search for contacts
 *  - `Pinned`: Search for pinned messages
 */
export const SearchFilters = {
    Empty: { _: 'inputMessagesFilterEmpty' } as tl.TypeMessagesFilter,
    Photo: { _: 'inputMessagesFilterPhotos' } as tl.TypeMessagesFilter,
    Video: { _: 'inputMessagesFilterVideo' } as tl.TypeMessagesFilter,
    PhotoAndVideo: { _: 'inputMessagesFilterPhotoVideo' } as tl.TypeMessagesFilter,
    Document: { _: 'inputMessagesFilterDocument' } as tl.TypeMessagesFilter,
    Url: { _: 'inputMessagesFilterUrl' } as tl.TypeMessagesFilter,
    Gif: { _: 'inputMessagesFilterGif' } as tl.TypeMessagesFilter,
    Voice: { _: 'inputMessagesFilterVoice' } as tl.TypeMessagesFilter,
    Audio: { _: 'inputMessagesFilterMusic' } as tl.TypeMessagesFilter,
    ChatPhotoChange: { _: 'inputMessagesFilterChatPhotos' } as tl.TypeMessagesFilter,
    Call: { _: 'inputMessagesFilterPhoneCalls' } as tl.TypeMessagesFilter,
    Round: { _: 'inputMessagesFilterRoundVideo' } as tl.TypeMessagesFilter,
    RoundAndVoice: { _: 'inputMessagesFilterRoundVoice' } as tl.TypeMessagesFilter,
    MyMention: { _: 'inputMessagesFilterMyMentions' } as tl.TypeMessagesFilter,
    Location: { _: 'inputMessagesFilterGeo' } as tl.TypeMessagesFilter,
    Contact: { _: 'inputMessagesFilterContacts' } as tl.TypeMessagesFilter,
    Pinned: { _: 'inputMessagesFilterPinned' } as tl.TypeMessagesFilter,
} as const
