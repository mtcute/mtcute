import type { PublicPart } from '../../types/utils.js'
import type { AppConfigManager } from '../managers/app-config-manager.js'

import type { WorkerInvoker } from './invoker.js'

export class AppConfigManagerProxy implements PublicPart<AppConfigManager> {
    readonly get: AppConfigManager['get']
    readonly getField: AppConfigManager['getField']

    constructor(readonly invoker: WorkerInvoker) {
        const bind = invoker.makeBinder<AppConfigManager>('app-config')

        this.get = bind('get')
        this.getField = bind('getField')
    }
}
