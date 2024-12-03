import type { MaybePromise } from '@mtcute/core'

import type { MessageContext } from './context/message.js'
import type { DispatcherParams } from './dispatcher.js'
import type { UpdateFilter } from './filters/index.js'
import type { UpdateState } from './state/update-state.js'
import { Dispatcher } from './dispatcher.js'
import { filters } from './filters/index.js'

/**
 * Action for the wizard scene.
 *
 * `Next`: Continue to the next registered step
 * (or exit, if this is the last step)
 *
 * `Stay`: Stay on the same step
 *
 * `Exit`: Exit from the wizard scene
 *
 * You can also return a `number` to jump to that step
 */
export enum WizardSceneAction {
    Next = 'next',
    Stay = 'stay',
    Exit = 'exit',
}

interface WizardInternalState {
    $step?: number
}

/**
 * Wizard is a special type of Dispatcher
 * that can be used to simplify implementing
 * step-by-step scenes.
 */
export class WizardScene<State extends object> extends Dispatcher<State & WizardInternalState> {
    private _steps = 0

    private _defaultState: State & WizardInternalState = {} as State & WizardInternalState

    constructor(name: string, params?: Omit<DispatcherParams, 'sceneName'>) {
        super(undefined, { sceneName: name, ...params })
    }

    // remove inherited statics from Dispatcher
    declare static for: never
    declare static child: never
    declare static scene: never

    setDefaultState(defaultState: State): void {
        this._defaultState = defaultState as State & WizardInternalState
    }

    /**
     * Get the total number of registered steps
     */
    get totalSteps(): number {
        return this._steps
    }

    /**
     * Go to the Nth step
     */
    async goToStep(state: UpdateState<WizardInternalState>, step: number): Promise<void> {
        if (step >= this._steps) {
            await state.exit()
        } else {
            await state.merge({ $step: step }, { fallback: this._defaultState })
        }
    }

    /**
     * Skip N steps
     */
    async skip(state: UpdateState<WizardInternalState>, count = 1): Promise<void> {
        const { $step } = (await state.get()) || {}
        if ($step === undefined) throw new Error('Wizard state is not initialized')

        return this.goToStep(state, $step + count)
    }

    /**
     * Filter that will only pass if the current step is `step`
     */
    // eslint-disable-next-line ts/no-empty-object-type
    static onNthStep(step: number): UpdateFilter<any, {}, WizardInternalState> {
        const filter = filters.state<WizardInternalState>(it => it.$step === step)

        if (step === 0) return filters.or(filters.stateEmpty, filter)

        return filter
    }

    /**
     * Filter that will only pass if the current step is the one after last one added
     */
    // eslint-disable-next-line ts/no-empty-object-type
    onCurrentStep(): UpdateFilter<any, {}, WizardInternalState> {
        return WizardScene.onNthStep(this._steps)
    }

    /**
     * Add a step to the wizard
     */
    addStep(
        handler: (
            msg: MessageContext,
            state: UpdateState<State & WizardInternalState>,
        ) => MaybePromise<WizardSceneAction | number>,
    ): void {
        const step = this._steps++

        this.onNewMessage(WizardScene.onNthStep(step), async (msg, state) => {
            const result = await handler(msg, state)

            if (typeof result === 'number') {
                await this.goToStep(state, result)

                return
            }

            switch (result) {
                case 'next': {
                    await this.goToStep(state, step + 1)
                    break
                }
                case 'exit':
                    await state.exit()
                    break
            }
        })
    }
}
