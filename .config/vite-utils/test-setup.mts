import { setPlatform } from '../../packages/core/src/platform.js'

// @ts-expect-error no .env here
const TEST_ENV = import.meta.env.TEST_ENV
if (TEST_ENV === 'browser' || TEST_ENV === 'deno') {
    setPlatform(new (await import('../../packages/web/src/platform.js')).WebPlatform())
} else {
    setPlatform(new (await import('../../packages/node/src/common-internals-node/platform.js')).NodePlatform())
}