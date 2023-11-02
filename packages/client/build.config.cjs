module.exports = ({ fs, path, outDir }) => ({
    esmOnlyDirectives: true,
    final() {
        function fixClient(file) {
            // make TelegramClient a class, not an interface
            const dTsContent = fs.readFileSync(path.join(outDir, file), 'utf8')

            fs.writeFileSync(
                path.join(outDir, file),
                dTsContent.replace('export interface TelegramClient', 'export class TelegramClient'),
            )
        }

        fixClient('esm/client.d.ts')
        fixClient('cjs/client.d.ts')
    },
})
