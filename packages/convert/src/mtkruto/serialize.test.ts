import { describe, expect, it } from 'vitest'
import { u8HexDecode } from '@mtcute/test'

import { MTKRUTO_SESSION } from './__fixtures__/session.js'
import { serializeMtkrutoSession } from './serialize.js'

describe('mtkruto/serialize', () => {
    it('should correctly serialize sessions', () => {
        expect(
            serializeMtkrutoSession({
                dcId: 2,
                isTest: true,
                authKey: u8HexDecode(
                    '58420a6b4ec287ef73a00d36e260cea6cbf6d135b8630ba845144ea928b8d584'
                    + '026c3ddce272a7cfb05c148bb599f9fa7fa5e6dce4d5aa84f4ce26f8a7f02e64'
                    + '3f47fadf23e406a079c460fa84a94259a3a2251acca412c67c56a2d1967f598f'
                    + '367b4078ebc335ae6dd4d8d75319aa741dded808d82c5fc4da30c4495814b830'
                    + '5050c04720373fc45040973ea4571099ea220d2476e7c89d85d7db5b10f149bd'
                    + '233df7d44a6858f9954515b34a8a3571149ac15852e21d3c1ce35a2958f14bdf'
                    + 'f67614ff15ddf4250074b9fe2e1a696947a1321fdf39fc64420d843214d4331a'
                    + 'ba1e6f8525adec5d1f9313838eda2efbb3dd22e9ee0edab2426e2cb5eb8d25cf',
                ),
            }),
        ).toEqual(MTKRUTO_SESSION)
    })
})
