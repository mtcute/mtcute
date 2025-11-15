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
  Empty: { _: 'inputMessagesFilterEmpty' } as const,
  Photo: { _: 'inputMessagesFilterPhotos' } as const,
  Video: { _: 'inputMessagesFilterVideo' } as const,
  PhotoAndVideo: {
    _: 'inputMessagesFilterPhotoVideo',
  } as const,
  Document: { _: 'inputMessagesFilterDocument' } as const,
  Url: { _: 'inputMessagesFilterUrl' } as const,
  Gif: { _: 'inputMessagesFilterGif' } as const,
  Voice: { _: 'inputMessagesFilterVoice' } as const,
  Audio: { _: 'inputMessagesFilterMusic' } as const,
  ChatPhotoChange: {
    _: 'inputMessagesFilterChatPhotos',
  } as const,
  Call: { _: 'inputMessagesFilterPhoneCalls' } as const,
  Round: { _: 'inputMessagesFilterRoundVideo' } as const,
  RoundAndVoice: {
    _: 'inputMessagesFilterRoundVoice',
  } as const,
  MyMention: { _: 'inputMessagesFilterMyMentions' } as const,
  Location: { _: 'inputMessagesFilterGeo' } as const,
  Contact: { _: 'inputMessagesFilterContacts' } as const,
  Pinned: { _: 'inputMessagesFilterPinned' } as const,
} as const
