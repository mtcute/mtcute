import type { Plugin } from 'vite'
import * as cjsLexer from 'cjs-module-lexer'
import esbuild from 'esbuild'

await cjsLexer.init()

export function fixupCjs(): Plugin {
    return {
        name: 'fixup-cjs',
        async transform(code, id) {
            if (!id.match(/\/packages\/tl\/.*\.js$/)) return code

            const lexed = cjsLexer.parse(code)
            const r = await esbuild.transform(code, { format: 'esm' })
            code = r.code.replace(/export default require_stdin\(\);/, '')

            code += 'const __exp = require_stdin()\n'

            for (const exp of lexed.exports) {
                code += `export const ${exp} = __exp.${exp}\n`
            }

            return code
        },
    }
}
