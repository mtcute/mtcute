import { describe, expect, it } from 'vitest'

import { getPlatform } from '../../platform.js'
import { guessFileMime, MIME_TO_EXTENSION } from './file-type.js'

const p = getPlatform()

describe('guessFileMime', () => {
    it.each([
        ['424d', 'image/bmp', 'bmp'],
        ['4d5a', 'application/x-msdownload', 'exe'],
        ['1f9d', 'application/x-compress', 'z'],
        ['1fa0', 'application/x-compress', 'z'],
        ['1f8b', 'application/gzip', 'gz'],
        ['425a68', 'application/x-bzip2', 'bz2'],
        ['494433', 'audio/mpeg', 'mp3'],
        ['fffb', 'audio/mpeg', 'mp3'],
        ['fff3', 'audio/mpeg', 'mp3'],
        ['fff2', 'audio/mpeg', 'mp3'],
        ['504b0304', 'application/zip', 'zip'],
        ['38425053', 'image/vnd.adobe.photoshop', 'psd'],
        ['7f454c46', 'application/x-elf', undefined],
        ['feedfacf', 'application/x-mach-binary', undefined],
        ['28b52ffd', 'application/zstd', 'zst'],
        ['664c6143', 'audio/x-flac', 'flac'],
        ['ffd8ffdb', 'image/jpeg', 'jpg'],
        ['ffd8ffe0', 'image/jpeg', 'jpg'],
        ['ffd8ffee', 'image/jpeg', 'jpg'],
        ['ffd8ffe1', 'image/jpeg', 'jpg'],
        ['4f676753', 'application/ogg', 'ogg'],
        ['4f6767530000000000000000000000000000000000000000000000004f70757348656164', 'audio/ogg', 'ogg'],
        ['4f67675300000000000000000000000000000000000000000000000001766964656f', 'video/ogg', 'ogv'],
        ['4f6767530000000000000000000000000000000000000000000000007f464c4143', 'audio/ogg', 'ogg'],
        ['4f67675300000000000000000000000000000000000000000000000001766f72626973', 'audio/ogg', 'ogg'],
        ['255044462d', 'application/pdf', 'pdf'],
        ['474946383761', 'image/gif', 'gif'],
        ['474946383961', 'image/gif', 'gif'],
        ['377abcaf271c', 'application/x-7z-compressed', '7z'],
        ['89504e470d0a1a0a', 'image/png', 'png'],
        ['526172211a0700', 'application/x-rar-compressed', 'rar'],
        ['526172211a0701', 'application/x-rar-compressed', 'rar'],
        ['000000006674797061766966', 'image/avif', 'avif'],
        ['000000006674797061766973', 'image/avif', 'avif'],
        ['00000000667479706d696631', 'image/heif', 'heif'],
        ['000000006674797068656963', 'image/heic', 'heic'],
        ['000000006674797068656978', 'image/heic', 'heic'],
        ['000000006674797068657663', 'image/heic-sequence', 'heic'],
        ['000000006674797068657678', 'image/heic-sequence', 'heic'],
        ['000000006674797071740000', 'video/quicktime', 'mov'],
        ['00000000667479704d345600', 'video/x-m4v', 'm4v'],
        ['00000000667479704d345648', 'video/x-m4v', 'm4v'],
        ['00000000667479704d345650', 'video/x-m4v', 'm4v'],
        ['00000000667479704d345000', 'video/mp4', 'mp4'],
        ['00000000667479704d344100', 'audio/x-m4a', 'm4a'],
        ['00000000667479704d344200', 'audio/mp4', 'm4a'],
        ['000000006674797046344100', 'audio/mp4', 'm4a'],
        ['000000006674797046344200', 'audio/mp4', 'm4a'],
        ['000000006674797063727800', 'image/x-canon-cr3', 'cr3'],
        ['000000006674797033673200', 'video/3gpp2', '3g2'],
        ['000000006674797033670000', 'video/3gpp', '3gp'],
    ])('should detect %s as %s with %s extension', (header, mime, ext) => {
        header += '00'.repeat(16)

        expect(guessFileMime(p.hexDecode(header))).toEqual(mime)
        expect(MIME_TO_EXTENSION[mime]).toEqual(ext)
    })
})
