import { MtTypeAssertionError, tl } from '@mtcute/core'

import { StoryInteractiveLocation } from './location'
import { StoryInteractiveReaction } from './reaction'
import { StoryInteractiveVenue } from './venue'

export * from './input'

export type StoryInteractiveElement = StoryInteractiveReaction | StoryInteractiveLocation | StoryInteractiveVenue

export function _storyInteractiveElementFromTl(raw: tl.TypeMediaArea): StoryInteractiveElement {
    switch (raw._) {
        case 'mediaAreaSuggestedReaction':
            return new StoryInteractiveReaction(raw)
        case 'mediaAreaGeoPoint':
            return new StoryInteractiveLocation(raw)
        case 'mediaAreaVenue':
            return new StoryInteractiveVenue(raw)
        case 'inputMediaAreaVenue':
            throw new MtTypeAssertionError('StoryInteractiveElement', '!input*', raw._)
    }
}
