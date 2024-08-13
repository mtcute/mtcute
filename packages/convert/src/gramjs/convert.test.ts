import { describe, expect, it } from 'vitest'
import { getPlatform } from '@mtcute/core/platform.js'

import { GRAMJS_SESSION } from './__fixtures__/session.js'
import { convertFromGramjsSession, convertToGramjsSession } from './convert.js'

describe('gramjs/convert', () => {
    it('should correctly convert from gramjs sessions', () => {
        expect(convertFromGramjsSession(GRAMJS_SESSION)).toEqual({
            authKey: getPlatform().hexDecode(
                'ad286dc1184bc61bfc8ed8942c1a2ef5bce1d5c25f6a069c1606fb3b8c722261'
                + '1cff7d73c649bf0c49807f3253542ba88f8687490ad0902e42e708a437eafe32'
                + '552d9d594629aae72cb55db784b3ae60b59035f925306515da861f8dcc66cf98'
                + 'e5543029c2b5138da3d18dbdcc7f43149746b87b4ff2b4618375887b0ad6f243'
                + '93cfd2527b61bd3366472702f892e7e1f32d72da8fe0b7b658f387fdd7986d41'
                + '74065c2647beccedfbf51994889ea0a059179a225e67be7d08a80e263824e474'
                + 'e81cbf03a20765265f08b2227c51b8b7412322db0540c2b939662f59b7149a9b'
                + 'b84a59114267a097f6603159d7047a4df2f43144b55709e339ccb7588205c308',
            ),
            primaryDcs: {
                main: {
                    id: 2,
                    ipAddress: '149.154.167.40',
                    ipv6: false,
                    port: 443,
                },
                media: {
                    id: 2,
                    ipAddress: '149.154.167.40',
                    ipv6: false,
                    port: 443,
                },
            },
            testMode: true,
            version: 3,
        })
    })

    it('should correctly convert to gramjs sessions', () => {
        expect(
            convertToGramjsSession({
                authKey: getPlatform().hexDecode(
                    'ad286dc1184bc61bfc8ed8942c1a2ef5bce1d5c25f6a069c1606fb3b8c722261'
                    + '1cff7d73c649bf0c49807f3253542ba88f8687490ad0902e42e708a437eafe32'
                    + '552d9d594629aae72cb55db784b3ae60b59035f925306515da861f8dcc66cf98'
                    + 'e5543029c2b5138da3d18dbdcc7f43149746b87b4ff2b4618375887b0ad6f243'
                    + '93cfd2527b61bd3366472702f892e7e1f32d72da8fe0b7b658f387fdd7986d41'
                    + '74065c2647beccedfbf51994889ea0a059179a225e67be7d08a80e263824e474'
                    + 'e81cbf03a20765265f08b2227c51b8b7412322db0540c2b939662f59b7149a9b'
                    + 'b84a59114267a097f6603159d7047a4df2f43144b55709e339ccb7588205c308',
                ),
                primaryDcs: {
                    main: {
                        id: 2,
                        ipAddress: '149.154.167.40',
                        ipv6: false,
                        port: 443,
                    },
                    media: {
                        id: 2,
                        ipAddress: '149.154.167.40',
                        ipv6: false,
                        port: 443,
                    },
                },
                testMode: true,
                version: 3,
            }),
        ).toEqual(GRAMJS_SESSION)
    })
})
