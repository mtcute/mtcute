import { describe, expect, it } from 'vitest'

import { getPlatform } from '../../platform.js'
import { decodeWaveform, encodeWaveform } from './voice-utils.js'

const p = getPlatform()

describe('decodeWaveform', () => {
    it('should correctly decode telegram-encoded waveform', () => {
        expect(
            decodeWaveform(
                p.hexDecode(
                    '0000104210428c310821a51463cc39072184524a4aa9b51663acb5e69c7bef41' +
                        '08618c514a39e7a494d65aadb5f75e8c31ce396badf7de9cf3debbf7feff0f',
                ),
            ),
        ).toEqual([
            0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 10, 10, 10,
            11, 11, 11, 12, 12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19,
            19, 20, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 26, 26, 26, 27, 27, 27, 28,
            28, 28, 29, 29, 29, 30, 30, 30, 31, 31, 31,
        ])
    })
})

describe('encodeWaveform', () => {
    it('should correctly decode telegram-encoded waveform', () => {
        expect(
            p.hexEncode(
                encodeWaveform([
                    0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 10,
                    10, 10, 11, 11, 11, 12, 12, 12, 13, 13, 13, 14, 14, 14, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 18,
                    18, 18, 19, 19, 19, 20, 20, 20, 21, 21, 21, 22, 22, 22, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 26,
                    26, 26, 27, 27, 27, 28, 28, 28, 29, 29, 29, 30, 30, 30, 31, 31, 31,
                ]),
            ),
        ).toEqual(
            '0000104210428c310821a51463cc39072184524a4aa9b51663acb5e69c7bef41' +
                '08618c514a39e7a494d65aadb5f75e8c31ce396badf7de9cf3debbf7feff0f',
        )
    })
})
