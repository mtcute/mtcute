# Scenes

Scene is basically a child dispatcher with a name. It is not used by default,
unless you explicitly **enter** into it, after which **all** (supported*)
updates will be redirected to the scene, and not processed as usual.

This is particularly useful with FSM, since it allows users to
enter independent "dialogues" with the bot.

<!-- Full example: TODO LINK -->

<p><small>* Only updates that can be <a href="./state#keying">keyed</a> are supported</small></p>

## Creating a scene

A scene is created by using `Dispatcher.scene`:

```ts
interface SceneState { ... }

const dp = Dispatcher.scene<SceneState>('scene-name')
// add handlers to `dp`

export const SomeScene = dp

// then in the main file:
dp.addScene(SomeScene)
```

If you don't use state within your scene, just don't pass anything:

```ts
const scene = Dispatcher.scene()
```

::: tip
Scenes should only be added to the root dispatcher.
:::

Scene names can't start with `$` (dollar sign), since it is reserved
for internal FSM needs. Other than that, you can use any name.

## Entering a scene

To enter a scene or change current scene, use `state.enter` and pass the scene instance:

```ts
dp.onNewMessage(async (msg, state) => {
  await state.enter(SomeScene)
})
```

You can also pass some initial state to the scene:
```ts
dp.onNewMessage(async (msg, state) => {
  await state.enter(SomeScene, { with: { foo: 'bar' } })
})
```

By default, new scene will be used starting from the next update,
but in some cases you may want it to be used immediately.

To make the dispatcher immediately dispatch the update to the newly
entered scene, use `PropagationAction.ToScene`:

```ts
dp.onNewMessage(async (msg, state) => {
  await state.enter(SomeScene)
  return PropagationAction.ToScene
})
```

## Exiting a scene

To exit from the current scene, use `state.exit`:

```ts
dp.onNewMessage(async (msg, state) => {
  await state.exit()
})
```

To make the dispatcher immediately dispatch the update to the
root dispatcher, use `PropagationAction.ToScene`:

```ts
dp.onNewMessage(async (msg, state) => {
  await state.exit()
  return PropagationAction.ToScene
})
```

Entering another scene will also exit the current one.

## Isolated state

By default, scenes have their own, fully isolated FSM state,
which is (by default) destroyed as soon as the user leaves the scene.
This is more clean than using the global state, and also allows
scenes to have their own state type.

However, in some cases, you may want to access global FSM state.
This is possible with `getGlobalState`:

```ts
dp.onNewMessage(async (msg, state) => {
  const local = await state.get()

  const globalState = await dp.getGlobalState<BotState>(msg)
  const global = await globalState.get()
})
```

Alternatively, you can disable isolated storage for FSM altogether and use
global state directly:

```ts
const dp = Dispatcher.scene<BotState>()
// add handlers to `dp`

export const SomeScene = dp

// in the main file:
dp.addScene(SomeScene, /* scoped: */ false)
```

In this case, `scene` can't have state type other than `BotState` (i.e. the
one used by the parent), and it will not be reset when the user
leaves the scene.


## Wizard scenes

A commonly used pattern for scenes is a step-by-step wizard.

To simplify their creation, mtcute implements `WizardScene`,
which is simply a Dispatcher with an additional method: `addStep`.

Every step is an `onNewMessage` handler that is filtered by the current
step, which is stored in wizard's FSM state. In each step, you can
choose either to `WizardAction.Stay` in the same step, proceed to the
`WizardAction.Next` step, or `WizardAction.Exit` the wizard altogether.

You can also return a `number` to jump to some step (ordering starts from 0).

Additionally, wizard provides `onCurrentStep` filter that filters for updates that
happened *after* the last triggered step.

<!-- A simple example (full example TODO LINK): -->
A simple example:

```ts
interface RegForm {
  name?: string
}

const wizard = new WizardScene<RegForm>('REGISTRATION')

wizard.addStep(async (msg) => {
  await msg.answerText('What is your name?',  {
    replyMarkup: BotKeyboard.inline([[BotKeyboard.callback('Skip', 'SKIP')]]),
  })

  return WizardSceneAction.Next
})

wizard.onCallbackQuery(filters.and(wizard.onCurrentStep(), filters.equals('SKIP')), async (upd, state) => {
  await state.merge({ name: 'Anonymous' })
  await wizard.skip(state)

  await upd.client.sendText(upd.chatId, 'Alright, "Anonymous" then\n\nNow enter your email')
})

wizard.addStep(async (msg, state) => {
  // simple validation
  if (msg.text.length < 3) {
    await msg.replyText('Invalid name!')
    return WizardSceneAction.Stay
  }

  await state.set({ name: msg.text.trim() })
  await msg.answerText('Enter your email')

  return WizardSceneAction.Next
})

wizard.addStep(async (msg, state) => {
  const { name } = (await state.get())!

  console.log({ name, email: msg.text })

  await msg.answerText('Thanks!')
  return WizardSceneAction.Exit
})
```

If you are using some custom state, you may want to set the default
state for the wizard:

```ts
wizard.setDefaultState({ name: 'Ivan' })
```

By default, `{}` is used as the default state.

## Transition updates

Whenever you `.enter()` or `.exit()` a scene, the dispatcher will also emit
a transition update, which can be caught by using `onSceneTransition`:

```ts
scene.onSceneTransition(async (upd, state) => {
  console.log(`Transition from ${upd.previousScene} to SomeScene`)
})
```

These handlers are called **before** any of the scene's handlers are called,
even if `PropagationAction.ToScene` is used, and can be used to cancel the transition:

```ts
dp.onNewMessage(async (msg, state) => {
  await state.enter(SomeScene)
  return PropagationAction.ToScene
})

SomeScene.onSceneTransition(async (upd, state) => {
  await state.exit()
  return PropagationAction.Stop
})

SomeScene.onNewMessage(async (msg, state) => {
  await msg.replyText('This will never be called')
})
```

The update which triggered the transition is passed to the handler, and
you can use it to decide whether to cancel the transition or not:

```ts
SomeScene.onSceneTransition(async (upd, state) => {
  if (upd.message.text === 'cancel') {
    return PropagationAction.Stop
  }
})
```
