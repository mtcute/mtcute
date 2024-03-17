import { describe, expect, it } from 'vitest'

import { getPlatform } from '../../platform.js'
import {
    extractFileName,
    inflateSvgPath,
    isProbablyPlainText,
    strippedPhotoToJpg,
    svgPathToFile,
} from './file-utils.js'

const p = getPlatform()

describe('isProbablyPlainText', () => {
    it('should return true for buffers only containing printable ascii', () => {
        expect(isProbablyPlainText(p.utf8Encode('hello this is some ascii text'))).to.be.true
        expect(isProbablyPlainText(p.utf8Encode('hello this is some ascii text\nwith unix new lines'))).to.be.true
        expect(isProbablyPlainText(p.utf8Encode('hello this is some ascii text\r\nwith windows new lines'))).to.be.true
        expect(isProbablyPlainText(p.utf8Encode('hello this is some ascii text\n\twith unix new lines and tabs'))).to.be
            .true
        expect(isProbablyPlainText(p.utf8Encode('hello this is some ascii text\r\n\twith windows new lines and tabs')))
            .to.be.true
    })

    it('should return false for buffers containing some binary data', () => {
        expect(isProbablyPlainText(p.utf8Encode('hello this is cedilla: ç'))).to.be.false
        expect(isProbablyPlainText(p.utf8Encode('hello this is some ascii text with emojis 🌸'))).to.be.false

        // random strings of 16 bytes
        expect(isProbablyPlainText(p.hexDecode('717f80f08eb9d88c3931712c0e2be32f'))).to.be.false
        expect(isProbablyPlainText(p.hexDecode('20e8e218e54254c813b261432b0330d7'))).to.be.false
    })
})

describe('extractFileName', () => {
    it('should extract file name from a path', () => {
        expect(extractFileName('file.txt')).toEqual('file.txt')
        expect(extractFileName('/home/user/file.txt')).toEqual('file.txt')
        expect(extractFileName('C:\\Users\\user\\file.txt')).toEqual('file.txt')
    })

    it('should skip file: prefix', () => {
        expect(extractFileName('file:file.txt')).toEqual('file.txt')
        expect(extractFileName('file:/home/user/file.txt')).toEqual('file.txt')
        expect(extractFileName('file:C:\\Users\\user\\file.txt')).toEqual('file.txt')
    })
})

describe('svgPathToFile', () => {
    it('should convert SVG path to a file', () => {
        const path = 'M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z'

        expect(p.utf8Decode(svgPathToFile(path))).toMatchInlineSnapshot(
            '"<?xml version="1.0" encoding="utf-8"?><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"viewBox="0 0 512 512" xml:space="preserve"><path d="M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z"/></svg>"',
        )
    })
})

describe('inflateSvgPath', () => {
    const data = p.hexDecode(
        '1a05b302dc5f4446068649064247424a6a4c704550535b5e665e5e4c044a024c' +
            '074e06414d80588863935fad74be4704854684518b528581904695498b488b56' +
            '965c85438d8191818543894a8f4d834188818a4284498454895d9a6f86074708' +
            '8d0146089283a281b48bbfa386078a04880390098490949997ab828a4b984a9d' +
            '8490b395aa9949845c485d4a42434b4a4a46848a8792859d4186468c48938182' +
            '91a293ac859781af848701818989928b9c849086a785b880816c8071817c814c' +
            '0080520081',
    )
    const path =
        'M265,512c-31-4-66,6-96-2-7-2-10-42-12-48-5-16-19-27-30' +
        '-38-30-30-124-102-127-146-1-13,0-24,8-35,19-31,45-52,62-74,5-6,4-17,11-18,' +
        '5,1,16-6,21-9,11-8,11-22,22-28,5-3,13,1,17,1,5-3,9-10,15-13,3-1,8,1,10-2,4' +
        '-9,4-20,9-29,26-47,67-78,131-68,18,3,34,1,52,11,63,35,67,104,83,169,4,16,20,' +
        '25,23,43,2,10-11,24-10,29,4,16,51,21,42,25-9,4-28-8-29-10-2-3-11-10-10-6,4,10,' +
        '7,18,5,29-1,6-6,12-8,19,1,2,17,34,19,44,5,23,1,47,4,71,1,9,9,18,11,28,4,16,6,39,' +
        '5,56,0,1-44,0-49,1-60,1-120,0-180,1z'

    it('should correctly inflate svg path', () => {
        expect(inflateSvgPath(data)).toEqual(path)
    })
})

describe('strippedPhotoToJpg', () => {
    // strippedThumb of @Channel_Bot
    const dataPfp = p.hexDecode('010808b1f2f95fed673451457033ad1f')
    // photoStrippedSize of a random image
    const dataPicture = p.hexDecode(
        '012728b532aacce4b302d8c1099c74a634718675cb6381f73d3ffd557667d9b5' +
            '816f4c28ce69aa58a863238cf62a334590f999042234cbe1986d03eefe14c68e' +
            '32847cc00ce709ea7ffad577773f78fe54d6c927f78c3db14ac1ccca91a2ef4f' +
            '9d89dd9e53e9455c456072646618e840a28b20bb223275e463b55769b07e4cf1' +
            'c52cedfbb03d38aab9e718356909b2733c839cf5a72dc3646ee6a4bb882c2ac0' +
            '70a31c554c1d81f0403eb4d598b5350b8680b03c628aab09ff0044707b1a2a5a' +
            '012e016420753cd25b491ac603a723bd14517ba28b46788c5e613f27d2a9cb32' +
            'ceca2353807bd14525b831e6175deccde991eb45145508',
    )

    it('should inflate stripped jpeg (from profile picture)', () => {
        expect(p.hexEncode(strippedPhotoToJpg(dataPfp))).toMatchInlineSnapshot(
            '"ffd8ffe000104a46494600010100000100010000ffdb004300281c1e231e192' +
                '82321232d2b28303c64413c37373c7b585d4964918099968f808c8aa0b4e6c3a' +
                '0aadaad8a8cc8ffcbdaeef5ffffff9bc1fffffffaffe6fdfff8ffdb0043012b2' +
                'd2d3c353c76414176f8a58ca5f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f' +
                '8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8ffc' +
                '00011080008000803012200021101031101ffc4001f000001050101010101010' +
                '0000000000000000102030405060708090a0bffc400b51000020103030204030' +
                '50504040000017d01020300041105122131410613516107227114328191a1082' +
                '342b1c11552d1f02433627282090a161718191a25262728292a3435363738393' +
                'a434445464748494a535455565758595a636465666768696a737475767778797' +
                'a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b' +
                '7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf' +
                '1f2f3f4f5f6f7f8f9faffc4001f0100030101010101010101010000000000000' +
                '102030405060708090a0bffc400b511000201020404030407050404000102770' +
                '00102031104052131061241510761711322328108144291a1b1c109233352f01' +
                '56272d10a162434e125f11718191a262728292a35363738393a4344454647484' +
                '94a535455565758595a636465666768696a737475767778797a8283848586878' +
                '8898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c' +
                '4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f' +
                '9faffda000c03010002110311003f00b1f2f95fed673451457033ad1fffd9"',
        )
    })

    it('should inflate stripped jpeg (from a picture)', () => {
        expect(p.hexEncode(strippedPhotoToJpg(dataPicture))).toMatchInlineSnapshot(
            '"ffd8ffe000104a46494600010100000100010000ffdb004300281c1e231e192' +
                '82321232d2b28303c64413c37373c7b585d4964918099968f808c8aa0b4e6c3a' +
                '0aadaad8a8cc8ffcbdaeef5ffffff9bc1fffffffaffe6fdfff8ffdb0043012b2' +
                'd2d3c353c76414176f8a58ca5f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f' +
                '8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f8ffc' +
                '00011080027002803012200021101031101ffc4001f000001050101010101010' +
                '0000000000000000102030405060708090a0bffc400b51000020103030204030' +
                '50504040000017d01020300041105122131410613516107227114328191a1082' +
                '342b1c11552d1f02433627282090a161718191a25262728292a3435363738393' +
                'a434445464748494a535455565758595a636465666768696a737475767778797' +
                'a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b' +
                '7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf' +
                '1f2f3f4f5f6f7f8f9faffc4001f0100030101010101010101010000000000000' +
                '102030405060708090a0bffc400b511000201020404030407050404000102770' +
                '00102031104052131061241510761711322328108144291a1b1c109233352f01' +
                '56272d10a162434e125f11718191a262728292a35363738393a4344454647484' +
                '94a535455565758595a636465666768696a737475767778797a8283848586878' +
                '8898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c' +
                '4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f' +
                '9faffda000c03010002110311003f00b532aacce4b302d8c1099c74a63471867' +
                '5cb6381f73d3ffd557667d9b5816f4c28ce69aa58a863238cf62a334590f9990' +
                '42234cbe1986d03eefe14c68e32847cc00ce709ea7ffad577773f78fe54d6c92' +
                '7f78c3db14ac1ccca91a2ef4f9d89dd9e53e9455c456072646618e840a28b20b' +
                'b223275e463b55769b07e4cf1c52cedfbb03d38aab9e718356909b2733c839cf' +
                '5a72dc3646ee6a4bb882c2ac070a31c554c1d81f0403eb4d598b5350b8680b03' +
                'c628aab09ff0044707b1a2a5a012e016420753cd25b491ac603a723bd14517ba' +
                '28b46788c5e613f27d2a9cb32ceca2353807bd14525b831e6175deccde991eb4' +
                '5145508ffd9"',
        )
    })
})
