import { getPlatform } from '../../platform.js'
import { MtArgumentError } from '../../types/errors.js'
import { concatBuffers } from '../../utils/buffer-utils.js'

/**
 * Given file size, determine the appropriate chunk size (in KB)
 * for upload/download operations.
 */
export function determinePartSize(fileSize: number): number {
    if (fileSize <= 262078465) return 128 // 200 MB
    if (fileSize <= 786432000) return 256 // 750 MB
    if (fileSize <= 2097152000) return 512 // 2000 MB

    throw new MtArgumentError('File is too large')
}

/**
 * Returns `true` if all bytes in `buf` are printable ASCII characters
 */
export function isProbablyPlainText(buf: Uint8Array): boolean {
    return !buf.some(
        (it) =>
            !(
                (
                    (it >= 0x20 && it < 0x7f) || // printable ascii range
                    it === 0x0d || // CR
                    it === 0x0a || // LF
                    it === 0x09
                ) // Tab
            ),
    )
}

// from https://github.com/telegramdesktop/tdesktop/blob/bec39d89e19670eb436dc794a8f20b657cb87c71/Telegram/SourceFiles/ui/image/image.cpp#L225
const JPEG_HEADER = () =>
    getPlatform().hexDecode(
        'ffd8ffe000104a46494600010100000100010000ffdb004300281c1e231e1928' +
            '2321232d2b28303c64413c37373c7b585d4964918099968f808c8aa0b4e6c3a0aad' +
            'aad8a8cc8ffcbdaeef5ffffff9bc1fffffffaffe6fdfff8ffdb0043012b2d2d3c35' +
            '3c76414176f8a58ca5f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f' +
            '8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8ffc0001108000000' +
            '0003012200021101031101ffc4001f0000010501010101010100000000000000000' +
            '102030405060708090a0bffc400b5100002010303020403050504040000017d0102' +
            '0300041105122131410613516107227114328191a1082342b1c11552d1f02433627' +
            '282090a161718191a25262728292a3435363738393a434445464748494a53545556' +
            '5758595a636465666768696a737475767778797a838485868788898a92939495969' +
            '798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4' +
            'd5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc4001f0100030' +
            '101010101010101010000000000000102030405060708090a0bffc400b511000201' +
            '0204040304070504040001027700010203110405213106124151076171132232810' +
            '8144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a3536' +
            '3738393a434445464748494a535455565758595a636465666768696a73747576777' +
            '8797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5' +
            'b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f' +
            '3f4f5f6f7f8f9faffda000c03010002110311003f00',
    )
let JPEG_HEADER_BYTES: Uint8Array | null = null
const JPEG_FOOTER = new Uint8Array([0xff, 0xd9])

/**
 * Convert stripped JPEG (from `photoStrippedSize`) to full JPEG
 */
export function strippedPhotoToJpg(stripped: Uint8Array): Uint8Array {
    if (stripped.length < 3 || stripped[0] !== 1) {
        throw new MtArgumentError('Invalid stripped JPEG')
    }

    if (JPEG_HEADER_BYTES === null) {
        JPEG_HEADER_BYTES = JPEG_HEADER()
    }

    const result = concatBuffers([JPEG_HEADER_BYTES, stripped.slice(3), JPEG_FOOTER])
    result[164] = stripped[1]
    result[166] = stripped[2]

    return result
}

const SVG_LOOKUP = 'AACAAAAHAAALMAAAQASTAVAAAZaacaaaahaaalmaaaqastava.az0123456789-,'

/**
 * Inflate compressed preview SVG path to full SVG path
 * @param encoded
 */
export function inflateSvgPath(encoded: Uint8Array): string {
    let path = 'M'
    const len = encoded.length

    for (let i = 0; i < len; i++) {
        const num = encoded[i]

        if (num >= 192) {
            // 128 + 64
            path += SVG_LOOKUP[num - 192]
        } else {
            if (num >= 128) {
                path += ','
            } else if (num >= 64) {
                path += '-'
            }

            path += num & 63
        }
    }

    path += 'z'

    return path
}

/**
 * Convert SVG path to SVG file
 * @param path
 */
export function svgPathToFile(path: string): Uint8Array {
    return getPlatform().utf8Encode(
        '<?xml version="1.0" encoding="utf-8"?>' +
            '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
            'viewBox="0 0 512 512" xml:space="preserve">' +
            '<path d="' +
            path +
            '"/>' +
            '</svg>',
    )
}

/**
 * Get file name from file path
 *
 * @param path  File path
 */
export function extractFileName(path: string): string {
    if (path.startsWith('file:')) path = path.slice(5)

    return path.split(/[\\/]/).pop()!.split('?')[0]
}
