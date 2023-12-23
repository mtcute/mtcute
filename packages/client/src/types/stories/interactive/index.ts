import { MtTypeAssertionError, tl } from '@mtcute/core'

import { PeersIndex } from '../../peers/index.js'
import { StoryInteractiveChannelPost } from './channel-post.js'
import { StoryInteractiveLocation } from './location.js'
import { StoryInteractiveReaction } from './reaction.js'
import { StoryInteractiveVenue } from './venue.js'

export * from './input.js'
export { StoryInteractiveChannelPost, StoryInteractiveLocation, StoryInteractiveReaction, StoryInteractiveVenue }

export type StoryInteractiveElement =
    | StoryInteractiveReaction
    | StoryInteractiveLocation
    | StoryInteractiveVenue
    | StoryInteractiveChannelPost

export function _storyInteractiveElementFromTl(raw: tl.TypeMediaArea, peers: PeersIndex): StoryInteractiveElement {
    switch (raw._) {
        case 'mediaAreaSuggestedReaction':
            return new StoryInteractiveReaction(raw)
        case 'mediaAreaGeoPoint':
            return new StoryInteractiveLocation(raw)
        case 'mediaAreaVenue':
            return new StoryInteractiveVenue(raw)
        case 'mediaAreaChannelPost':
            return new StoryInteractiveChannelPost(raw, peers)
        case 'inputMediaAreaVenue':
        case 'inputMediaAreaChannelPost':
            throw new MtTypeAssertionError('StoryInteractiveElement', '!input*', raw._)
    }
}
