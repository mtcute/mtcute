import { describe, expect, it } from 'vitest'

import { hexDecodeToBuffer } from '@mtcute/tl-runtime'

import { guessFileMime } from './file-type.js'

describe('guessFileMime', () => {
    it.each([
        ['424d', 'image/bmp'],
        ['4d5a', 'application/x-msdownload'],
        ['1f9d', 'application/x-compress'],
        ['1fa0', 'application/x-compress'],
        ['1f8b', 'application/gzip'],
        ['425a68', 'application/x-bzip2'],
        ['494433', 'audio/mpeg'],
        ['fffb', 'audio/mpeg'],
        ['fff3', 'audio/mpeg'],
        ['fff2', 'audio/mpeg'],
        ['504b0304', 'application/zip'],
        ['38425053', 'image/vnd.adobe.photoshop'],
        ['7f454c46', 'application/x-elf'],
        ['feedfacf', 'application/x-mach-binary'],
        ['28b52ffd', 'application/zstd'],
        ['664c6143', 'audio/x-flac'],
        ['ffd8ffdb', 'image/jpeg'],
        ['ffd8ffe0', 'image/jpeg'],
        ['ffd8ffee', 'image/jpeg'],
        ['ffd8ffe1', 'image/jpeg'],
        ['4f676753', 'application/ogg'],
        ['4f6767530000000000000000000000000000000000000000000000004f70757348656164', 'audio/ogg'],
        ['4f67675300000000000000000000000000000000000000000000000001766964656f', 'video/ogg'],
        ['4f6767530000000000000000000000000000000000000000000000007f464c4143', 'audio/ogg'],
        ['4f67675300000000000000000000000000000000000000000000000001766f72626973', 'audio/ogg'],
        ['255044462d', 'application/pdf'],
        ['474946383761', 'image/gif'],
        ['474946383961', 'image/gif'],
        ['377abcaf271c', 'application/x-7z-compressed'],
        ['89504e470d0a1a0a', 'image/png'],
        ['526172211a0700', 'application/x-rar-compressed'],
        ['526172211a0701', 'application/x-rar-compressed'],
        ['000000006674797061766966', 'image/avif'],
        ['000000006674797061766973', 'image/avif'],
        ['00000000667479706d696631', 'image/heif'],
        ['000000006674797068656963', 'image/heic'],
        ['000000006674797068656978', 'image/heic'],
        ['000000006674797068657663', 'image/heic-sequence'],
        ['000000006674797068657678', 'image/heic-sequence'],
        ['000000006674797071740000', 'video/quicktime'],
        ['00000000667479704d345600', 'video/x-m4v'],
        ['00000000667479704d345648', 'video/x-m4v'],
        ['00000000667479704d345650', 'video/x-m4v'],
        ['00000000667479704d345000', 'video/mp4'],
        ['00000000667479704d344100', 'audio/x-m4a'],
        ['00000000667479704d344200', 'audio/mp4'],
        ['000000006674797046344100', 'audio/mp4'],
        ['000000006674797046344200', 'audio/mp4'],
        ['000000006674797063727800', 'image/x-canon-cr3'],
        ['000000006674797033673200', 'video/3gpp2'],
        ['000000006674797033670000', 'video/3gpp'],
    ])('should detect %s as %s', (header, mime) => {
        header += '00'.repeat(16)

        expect(guessFileMime(hexDecodeToBuffer(header))).toEqual(mime)
    })
})
