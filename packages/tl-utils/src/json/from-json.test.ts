import type { TlEntry } from '../types.js'

import { describe, expect, it } from 'vitest'
import { computeConstructorIdFromEntry } from '../ctor-id.js'

import { parseTlEntriesFromJson } from './from-json.js'

describe('parseTlEntriesFromJson', () => {
  const test = (json: object, expected: TlEntry[], params?: Parameters<typeof parseTlEntriesFromJson>[1]) => {
    const entries = parseTlEntriesFromJson(json, params)
    expect(entries).toEqual(expected)

    for (const entry of entries) {
      expect(entry.id).to.equal(computeConstructorIdFromEntry(entry), `ID for ${entry.name}`)
    }
  }

  it('parses simple constructors', () => {
    test(
      {
        constructors: [
          {
            id: '-1132882121',
            predicate: 'boolFalse',
            params: [],
            type: 'Bool',
          },
          {
            id: '-1720552011',
            predicate: 'boolTrue',
            params: [],
            type: 'Bool',
          },
        ],
        methods: [],
      },
      [
        {
          arguments: [],
          id: 3162085175,
          kind: 'class',
          name: 'boolFalse',
          type: 'Bool',
        },
        {
          arguments: [],
          id: 2574415285,
          kind: 'class',
          name: 'boolTrue',
          type: 'Bool',
        },
      ],
      { keepPrimitives: true },
    )
  })

  it('parses simple arguments', () => {
    test(
      {
        constructors: [
          {
            id: '-122978821',
            predicate: 'inputMediaContact',
            params: [
              { name: 'phone_number', type: 'string' },
              { name: 'first_name', type: 'string' },
              { name: 'last_name', type: 'string' },
              { name: 'vcard', type: 'string' },
            ],
            type: 'InputMedia',
          },
        ],
        methods: [],
      },
      [
        {
          arguments: [
            { name: 'phone_number', type: 'string' },
            { name: 'first_name', type: 'string' },
            { name: 'last_name', type: 'string' },
            { name: 'vcard', type: 'string' },
          ],
          id: 4171988475,
          kind: 'class',
          name: 'inputMediaContact',
          type: 'InputMedia',
        },
      ],
    )
  })

  it('parses predicated arguments', () => {
    test(
      {
        constructors: [
          {
            id: '-1110593856',
            predicate: 'inputChatUploadedPhoto',
            params: [
              { name: 'flags', type: '#' },
              { name: 'file', type: 'flags.0?InputFile' },
              { name: 'video', type: 'flags.1?InputFile' },
              { name: 'video_start_ts', type: 'flags.2?double' },
              { name: 'video_emoji_markup', type: 'flags.3?VideoSize' },
            ],
            type: 'InputChatPhoto',
          },
        ],
        methods: [],
      },
      [
        {
          arguments: [
            {
              name: 'flags',
              type: '#',
              typeModifiers: undefined,
            },
            {
              name: 'file',
              type: 'InputFile',
              typeModifiers: {
                predicate: 'flags.0',
              },
            },
            {
              name: 'video',
              type: 'InputFile',
              typeModifiers: {
                predicate: 'flags.1',
              },
            },
            {
              name: 'video_start_ts',
              type: 'double',
              typeModifiers: {
                predicate: 'flags.2',
              },
            },
            {
              name: 'video_emoji_markup',
              type: 'VideoSize',
              typeModifiers: {
                predicate: 'flags.3',
              },
            },
          ],
          id: 3184373440,
          kind: 'class',
          name: 'inputChatUploadedPhoto',
          type: 'InputChatPhoto',
        },
      ],
    )
  })

  it('parses vector arguments', () => {
    test(
      {
        constructors: [],
        methods: [
          {
            id: '1779249670',
            method: 'account.unregisterDevice',
            params: [
              { name: 'token_type', type: 'int' },
              { name: 'token', type: 'string' },
              { name: 'other_uids', type: 'Vector<long>' },
            ],
            type: 'Bool',
          },
          {
            id: '227648840',
            method: 'users.getUsers',
            params: [
              {
                name: 'id',
                type: 'Vector<InputUser>',
              },
            ],
            type: 'Vector<User>',
          },
        ],
      },
      [
        {
          arguments: [
            {
              name: 'token_type',
              type: 'int',
              typeModifiers: undefined,
            },
            {
              name: 'token',
              type: 'string',
              typeModifiers: undefined,
            },
            {
              name: 'other_uids',
              type: 'long',
              typeModifiers: {
                isVector: true,
              },
            },
          ],
          id: 1779249670,
          kind: 'method',
          name: 'account.unregisterDevice',
          type: 'Bool',
        },
        {
          arguments: [
            {
              name: 'id',
              type: 'InputUser',
              typeModifiers: {
                isVector: true,
              },
            },
          ],
          id: 227648840,
          kind: 'method',
          name: 'users.getUsers',
          type: 'User',
          typeModifiers: {
            isVector: true,
          },
        },
      ],
      { parseMethodTypes: true },
    )
  })
})
