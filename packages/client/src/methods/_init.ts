/* eslint-disable @typescript-eslint/no-unused-vars */

import { BaseTelegramClientOptions } from '@mtcute/core'

import { TelegramClient } from '../client'
// @copy
import { Conversation } from '../types/conversation'
// @copy
import { start } from './auth/start'
// @copy
import { enableUpdatesProcessing, makeParsedUpdateHandler, ParsedUpdateHandlerParams } from './updates'

// @copy
interface TelegramClientOptions extends BaseTelegramClientOptions {
    /**
     * Parameters for updates manager.
     */
    updates?: Omit<ParsedUpdateHandlerParams, 'onUpdate' | 'onRawUpdate'>
}

// @initialize
/** @internal */
function _initializeClient(this: TelegramClient, opts: TelegramClientOptions) {
    if (!opts.disableUpdates) {
        enableUpdatesProcessing(this, {
            onUpdate: makeParsedUpdateHandler({
                ...opts.updates,
                onUpdate: (update) => {
                    Conversation.handleUpdate(this, update)
                    this.emit('update', update)
                    this.emit(update.name, update.data)
                },
                onRawUpdate: (update, peers) => {
                    this.emit('raw_update', update, peers)
                },
            }),
        })

        this.start = async (params) => {
            const user = await start(this, params)
            await this.startUpdatesLoop()

            return user
        }
    } else {
        this.start = start.bind(null, this)
    }
    this.run = (params, then) => {
        this.start(params)
            .then(then)
            .catch((err) => this._emitError(err))
    }
}
