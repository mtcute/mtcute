import { MaybeAsync, Message } from '@mtcute/client'
import { Dispatcher } from './dispatcher'
import { NewMessageHandler } from './handler'
import { UpdateState } from './state'
import { filters } from './filters'

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
    Exit = 'exit'
}

interface WizardInternalState {
    $step: number
}

/**
 * Wizard is a special type of Dispatcher
 * that can be used to simplify implementing
 * step-by-step scenes.
 */
export class WizardScene<State, SceneName extends string = string> extends Dispatcher<
    State & WizardInternalState,
    SceneName
> {
    private _steps = 0

    private _defaultState: State & WizardInternalState = {} as any

    setDefaultState (defaultState: State): void {
        this._defaultState = defaultState as State & WizardInternalState
    }

    /**
     * Get the total number of registered steps
     */
    get totalSteps(): number {
        return this._steps
    }

    /**
     * Add a step to the wizard
     */
    addStep(handler: (msg: Message, state: UpdateState<State, SceneName>) => MaybeAsync<WizardSceneAction | number>): void {
        const step = this._steps++

        const filter = filters.state<WizardInternalState>((it) => it.$step === step)

        this.onNewMessage(
            step === 0
                ? filters.or(filters.stateEmpty, filter)
                : filter,
            async (msg: Message, state) => {
                const result = await handler(msg, state)

                if (typeof result === 'number') {
                    await state.merge({ $step: result }, this._defaultState)
                    return
                }

                switch (result) {
                    case 'next': {
                        const next = step + 1
                        if (next === this._steps) {
                            await state.exit()
                        } else {
                            await state.merge({ $step: next }, this._defaultState)
                        }
                        break
                    }
                    case 'exit':
                        await state.exit()
                        break
                }
            }
        )
    }
}
