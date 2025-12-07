import type ts from 'typescript'
import { StubTelegramClient } from '@mtcute/test'
import { describe, expect, it } from 'vitest'
import { TelegramClient } from './client.js'

if (process.env.TEST_ENV === 'node') {
  describe('TelegramClient', () => {
    it('should expose ITelegramClient', async () => {
      const ts = await import('typescript')
      const { readFile } = await import('node:fs/promises')
      const { fileURLToPath } = await import('node:url')
      const source = await readFile(fileURLToPath(new URL('./client.types.ts', import.meta.url)), 'utf-8')

      const program = ts.createSourceFile(
        'client.ts',
        source.toString(),
        ts.ScriptTarget.ES2022,
      )

      const iface = program.statements
        .find(stmt =>
          stmt.kind === ts.SyntaxKind.InterfaceDeclaration
          && (stmt as ts.InterfaceDeclaration).name.escapedText === 'ITelegramClient',
        ) as ts.InterfaceDeclaration

      if (!iface) {
        throw new Error('ITelegramClient interface not found')
      }

      const properties: string[] = []
      const methods: string[] = []

      for (const member of iface.members) {
        if (member.kind === ts.SyntaxKind.PropertySignature && member.name?.kind === ts.SyntaxKind.Identifier) {
          properties.push(member.name.text)
        } else if (member.kind === ts.SyntaxKind.MethodSignature && member.name?.kind === ts.SyntaxKind.Identifier) {
          methods.push(member.name.text)
        }
      }

      const base = new StubTelegramClient()
      const client = new TelegramClient({ client: base })

      for (const property of properties) {
        expect((client as any)[property], property).toBe((base as any)[property])
      }

      for (const method of methods) {
        expect((client as any)[method], method).toBeInstanceOf(Function)
      }
    })
  })
} else {
  describe.skip('TelegramClient', () => {})
}
