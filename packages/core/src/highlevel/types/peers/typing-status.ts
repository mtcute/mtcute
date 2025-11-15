/**
 * User typing status. Used to provide detailed
 * information about chat partners' actions:
 * typing messages, recording/uploading attachments, etc.
 *
 * Can be:
 *  - `typing`: User is typing
 *  - `cancel`: User is not doing anything (used to cancel previously sent status)
 *  - `record_video`: User is recording a video
 *  - `upload_video`: User is uploading a video
 *  - `record_voice`: User is recording a voice message
 *  - `upload_voice`: User is uploading a voice message
 *  - `upload_photo`: User is uploading a photo
 *  - `upload_document`: User is uploading a document
 *  - `geo`: User is choosing a geolocation to share
 *  - `contact`: User is choosing a contact to share
 *  - `game`: User is playing a game
 *  - `record_round`: User is recording a round video message
 *  - `upload_round`: User is uploading a round video message
 *  - `speak_call`: User is speaking in a group call
 *  - `history_import`: User is importing history
 *  - `sticker`: User is choosing a sticker
 *  - `interaction`: User has sent an emoji interaction
 *  - `interaction_seen`: User is watching a previously sent emoji interaction
 */
export type TypingStatus
  = | 'typing'
    | 'cancel'
    | 'record_video'
    | 'upload_video'
    | 'record_voice'
    | 'upload_voice'
    | 'upload_photo'
    | 'upload_document'
    | 'geo'
    | 'contact'
    | 'game'
    | 'record_round'
    | 'upload_round'
    | 'speak_call'
    | 'history_import'
    | 'sticker'
    | 'interaction'
    | 'interaction_seen'
