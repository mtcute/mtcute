import { MtTypeAssertionError, tl } from '@mtcute/core'

import { TelegramClient } from '../../../client'
import { StoryInteractiveLocation } from './location'
import { StoryInteractiveReaction } from './reaction'
import { StoryInteractiveVenue } from './venue'

export * from './input'

export type StoryInteractiveElement = StoryInteractiveReaction | StoryInteractiveLocation | StoryInteractiveVenue

export function _storyInteractiveElementFromTl(client: TelegramClient, raw: tl.TypeMediaArea): StoryInteractiveElement {
    switch (raw._) {
        case 'mediaAreaSuggestedReaction':
            return new StoryInteractiveReaction(client, raw)
        case 'mediaAreaGeoPoint':
            return new StoryInteractiveLocation(client, raw)
        case 'mediaAreaVenue':
            return new StoryInteractiveVenue(client, raw)
        case 'inputMediaAreaVenue':
            throw new MtTypeAssertionError('StoryInteractiveElement', '!input*', raw._)
    }
}
