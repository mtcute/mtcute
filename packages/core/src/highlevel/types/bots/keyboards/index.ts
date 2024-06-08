export * from './builder.js'
export * from './types.js'
import * as BotKeyboard from './factories.js'

export {
    /**
     * Convenience methods wrapping TL
     * objects creation for bot keyboard buttons.
     *
     * You can also use the type-discriminated objects directly.
     *
     * > **Note**: Button creation functions are intended to be used
     * > with inline reply markup, unless stated otherwise
     * > in the description.
     */
    BotKeyboard,
}
