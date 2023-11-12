/* eslint-disable @typescript-eslint/no-unused-vars */

import { BaseTelegramClientOptions } from '@mtcute/core'

import { TelegramClient } from '../client.js'
// @copy
import { Conversation } from '../types/conversation.js'
// @copy
import { logOut } from './auth/log-out.js'
// @copy
import { start } from './auth/start.js'
// @copy
import {
    enableUpdatesProcessing,
    makeParsedUpdateHandler,
    ParsedUpdateHandlerParams,
    UpdatesManagerParams,
} from './updates/index.js'

// @copy
interface TelegramClientOptions extends BaseTelegramClientOptions {
    /**
     * Parameters for updates manager.
     */
    updates?: Omit<ParsedUpdateHandlerParams & UpdatesManagerParams, 'onUpdate' | 'onRawUpdate'>
}

// @initialize
/** @internal */
function _initializeClient(this: TelegramClient, opts: TelegramClientOptions) {
    if (!opts.disableUpdates) {
        const { messageGroupingInterval, ...managerParams } = opts.updates ?? {}

        enableUpdatesProcessing(this, {
            ...managerParams,
            onUpdate: makeParsedUpdateHandler({
                messageGroupingInterval,
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
