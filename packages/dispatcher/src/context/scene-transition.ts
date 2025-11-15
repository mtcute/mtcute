import type { UpdateContextType } from './parse.js'
import { MtTypeAssertionError } from '@mtcute/core'

import { makeInspectable } from '@mtcute/core/utils.js'
import { BusinessMessageContext } from './business-message.js'
import { CallbackQueryContext, InlineCallbackQueryContext } from './callback-query.js'
import { MessageContext } from './message.js'

/** Update which is dispatched whenever scene is entered or exited */
export class SceneTransitionContext {
  constructor(
    /** Name of the previous scene, if any */
    readonly previousScene: string | null,
    /** Update, handler for which triggered the transition */
    readonly update: UpdateContextType,
  ) {}

  /** Get {@link update}, asserting it is a message-related update */
  get message(): MessageContext {
    if (this.update instanceof MessageContext) {
      return this.update
    }

    throw new MtTypeAssertionError('SceneTransitionContext.message', 'message', this.update._name)
  }

  /** Get {@link update}, asserting it is a business message-related update */
  get businessMessage(): BusinessMessageContext {
    if (this.update instanceof BusinessMessageContext) {
      return this.update
    }

    throw new MtTypeAssertionError('SceneTransitionContext.businessMessage', 'business message', this.update._name)
  }

  /** Get {@link update}, asserting it is a callback query update */
  get callbackQuery(): CallbackQueryContext {
    if (this.update instanceof CallbackQueryContext) {
      return this.update
    }

    throw new MtTypeAssertionError('SceneTransitionContext.callbackQuery', 'callback query', this.update._name)
  }

  /** Get {@link update}, asserting it is an inline callback query update */
  get inlineCallbackQuery(): InlineCallbackQueryContext {
    if (this.update instanceof InlineCallbackQueryContext) {
      return this.update
    }

    throw new MtTypeAssertionError(
      'SceneTransitionContext.inlineCallbackQuery',
      'inline callback query',
      this.update._name,
    )
  }
}

makeInspectable(SceneTransitionContext)
