import type { tl } from '../../../../tl/index.js'

import type { InputMediaAudio, InputMediaPhoto, InputMediaVideo } from '../../media/index.js'
import type { InputText } from '../../misc/entities.js'
import type {
  InputPageBlock,
  InputPageBlockOrFile,
  InputPageBlockWithFile,
} from './types.js'
import Long from 'long'
import { textWithEntitiesToRichText } from '../../../utils/entities.js'

/**
 * Input rich text, accepted by page block factories.
 *
 * Can be either a {@link tl.TypeRichText} (passed as-is), or an {@link InputText}
 * (a plain string or a {@link TextWithEntities}, e.g. from `html`/`md` tagged templates),
 * which is converted to {@link tl.TypeRichText}.
 */
export type InputRichText = InputText | tl.TypeRichText

/** Input page caption (used by media page blocks) */
export interface InputPageCaption {
  /** Caption text */
  text?: InputRichText
  /** Caption credit (e.g. author) */
  credit?: InputRichText
}

type Block<T extends tl.TypePageBlock['_']> = Extract<InputPageBlock, { _: T }>
type ListItem = Block<'pageBlockList'>['items'][number]
type OrderedListItem = Block<'pageBlockOrderedList'>['items'][number]

const RICH_EMPTY: tl.RawTextEmpty = { _: 'textEmpty' }

function normalizeRichText(text: InputRichText): tl.TypeRichText {
  if (typeof text === 'string') return { _: 'textPlain', text }
  if ('_' in text) return text
  return textWithEntitiesToRichText(text)
}

function normalizeCaption(input?: InputRichText | InputPageCaption): tl.RawPageCaption {
  if (input == null) return { _: 'pageCaption', text: RICH_EMPTY, credit: RICH_EMPTY }

  if (typeof input === 'string' || '_' in input || 'entities' in input) {
    return { _: 'pageCaption', text: normalizeRichText(input), credit: RICH_EMPTY }
  }

  return {
    _: 'pageCaption',
    text: input.text != null ? normalizeRichText(input.text) : RICH_EMPTY,
    credit: 'credit' in input && input.credit != null ? normalizeRichText(input.credit) : RICH_EMPTY,
  }
}

/** Create a footer block */
export function footer(text: InputRichText): tl.RawPageBlockFooter {
  return { _: 'pageBlockFooter', text: normalizeRichText(text) }
}

/** Create a paragraph block */
export function paragraph(text: InputRichText): tl.RawPageBlockParagraph {
  return { _: 'pageBlockParagraph', text: normalizeRichText(text) }
}

/** Create a "thinking" block */
export function thinking(text: InputRichText): tl.RawPageBlockThinking {
  return { _: 'pageBlockThinking', text: normalizeRichText(text) }
}

/** Create a heading block (`<h1>`–`<h6>`, depending on `level`) */
export function heading<Level extends 1 | 2 | 3 | 4 | 5 | 6>(
  level: Level,
  text: InputRichText,
): Extract<tl.TypePageBlock, { _: `pageBlockHeading${Level}` }> {
  return { _: `pageBlockHeading${level}`, text: normalizeRichText(text) } as Extract<tl.TypePageBlock, { _: `pageBlockHeading${Level}` }>
}

/** Create a divider (`<hr>`) block */
export function divider(): tl.RawPageBlockDivider {
  return { _: 'pageBlockDivider' }
}

/** Create an anchor block, to be referenced by name */
export function anchor(name: string): tl.RawPageBlockAnchor {
  return { _: 'pageBlockAnchor', name }
}

/** Create a TeX math block */
export function math(source: string): tl.RawPageBlockMath {
  return { _: 'pageBlockMath', source }
}

/** Create a preformatted (code) block */
export function preformatted(text: InputRichText, language = ''): tl.RawPageBlockPreformatted {
  return { _: 'pageBlockPreformatted', text: normalizeRichText(text), language }
}

/**
 * Create a blockquote block.
 *
 * Pass an array of blocks instead of rich text to create a blockquote
 * containing other blocks (`pageBlockBlockquoteBlocks`).
 */
export function blockquote(
  content: InputRichText | InputPageBlockOrFile[],
  caption?: InputRichText,
): tl.RawPageBlockBlockquote | Block<'pageBlockBlockquoteBlocks'> {
  const normalizedCaption = caption != null ? normalizeRichText(caption) : RICH_EMPTY

  if (Array.isArray(content)) {
    return { _: 'pageBlockBlockquoteBlocks', blocks: content, caption: normalizedCaption }
  }

  return { _: 'pageBlockBlockquote', text: normalizeRichText(content), caption: normalizedCaption }
}

/** Create a pullquote block */
export function pullquote(text: InputRichText, caption?: InputRichText): tl.RawPageBlockPullquote {
  return {
    _: 'pageBlockPullquote',
    text: normalizeRichText(text),
    caption: caption != null ? normalizeRichText(caption) : RICH_EMPTY,
  }
}

/** Create a map block */
export function map(params: {
  latitude: number
  longitude: number
  zoom: number
  width: number
  height: number
  caption?: InputRichText | InputPageCaption
}): tl.RawInputPageBlockMap {
  return {
    _: 'inputPageBlockMap',
    geo: { _: 'inputGeoPoint', lat: params.latitude, long: params.longitude },
    zoom: params.zoom,
    w: params.width,
    h: params.height,
    caption: normalizeCaption(params.caption),
  }
}

/** Create a list item (for {@link list}) */
export function listItem(
  content: InputRichText | InputPageBlockOrFile[],
  params: { checkbox?: boolean, checked?: boolean } = {},
): ListItem {
  if (Array.isArray(content)) {
    return {
      _: 'pageListItemBlocks',
      blocks: content,
      checkbox: params.checkbox,
      checked: params.checked,
    }
  }

  return {
    _: 'pageListItemText',
    text: normalizeRichText(content),
    checkbox: params.checkbox,
    checked: params.checked,
  }
}

/** Create an unordered list block */
export function list(items: ListItem[]): Block<'pageBlockList'> {
  return { _: 'pageBlockList', items }
}

/** Create an ordered list item (for {@link orderedList}) */
export function orderedListItem(
  content: InputRichText | InputPageBlockOrFile[],
  params: {
    checkbox?: boolean
    checked?: boolean
    num?: string
    value?: number
    type?: string
  } = {},
): OrderedListItem {
  if (Array.isArray(content)) {
    return {
      _: 'pageListOrderedItemBlocks',
      blocks: content,
      checkbox: params.checkbox,
      checked: params.checked,
      num: params.num,
      value: params.value,
      type: params.type,
    }
  }

  return {
    _: 'pageListOrderedItemText',
    text: normalizeRichText(content),
    checkbox: params.checkbox,
    checked: params.checked,
    num: params.num,
    value: params.value,
    type: params.type,
  }
}

/** Create an ordered list block */
export function orderedList(
  items: OrderedListItem[],
  params: { reversed?: boolean, start?: number, type?: string } = {},
): Block<'pageBlockOrderedList'> {
  return {
    _: 'pageBlockOrderedList',
    items,
    reversed: params.reversed,
    start: params.start,
    type: params.type,
  }
}

/** Create a table cell (for {@link tableRow}) */
export function tableCell(
  text?: InputRichText,
  params: {
    header?: boolean
    alignCenter?: boolean
    alignRight?: boolean
    valignMiddle?: boolean
    valignBottom?: boolean
    colspan?: number
    rowspan?: number
  } = {},
): tl.RawPageTableCell {
  return {
    _: 'pageTableCell',
    text: text != null ? normalizeRichText(text) : undefined,
    header: params.header,
    alignCenter: params.alignCenter,
    alignRight: params.alignRight,
    valignMiddle: params.valignMiddle,
    valignBottom: params.valignBottom,
    colspan: params.colspan,
    rowspan: params.rowspan,
  }
}

/** Create a table row (for {@link table}) */
export function tableRow(cells: tl.TypePageTableCell[]): tl.RawPageTableRow {
  return { _: 'pageTableRow', cells }
}

/** Create a table block */
export function table(
  rows: tl.TypePageTableRow[],
  params: { title?: InputRichText, bordered?: boolean, striped?: boolean } = {},
): tl.RawPageBlockTable {
  return {
    _: 'pageBlockTable',
    title: params.title != null ? normalizeRichText(params.title) : RICH_EMPTY,
    rows,
    bordered: params.bordered,
    striped: params.striped,
  }
}

/** Create a collage block */
export function collage(
  items: InputPageBlockOrFile[],
  caption?: InputRichText | InputPageCaption,
): Block<'pageBlockCollage'> {
  return { _: 'pageBlockCollage', items, caption: normalizeCaption(caption) }
}

/** Create a slideshow block */
export function slideshow(
  items: InputPageBlockOrFile[],
  caption?: InputRichText | InputPageCaption,
): Block<'pageBlockSlideshow'> {
  return { _: 'pageBlockSlideshow', items, caption: normalizeCaption(caption) }
}

/** Create a collapsible details block */
export function details(
  title: InputRichText,
  blocks: InputPageBlockOrFile[],
  params: {
    open?: boolean
  } = {},
): Block<'pageBlockDetails'> {
  return { _: 'pageBlockDetails', blocks, title: normalizeRichText(title), open: params.open }
}

/** Create a photo block, uploading the given file */
export function photo(
  file: string | tl.TypeInputPhoto | InputMediaPhoto,
  params: {
    caption?: InputRichText | InputPageCaption
    url?: string
    webpageId?: Long
    spoiler?: boolean
  } = {},
): InputPageBlockWithFile {
  return {
    // the default `auto` mode would upload it as a document, but we already know it should be a photo
    file: typeof file === 'string' ? { type: 'photo', file } : file,
    block: {
      _: 'pageBlockPhoto',
      photoId: Long.ZERO,
      caption: normalizeCaption(params.caption),
      url: params.url,
      webpageId: params.webpageId,
      spoiler: params.spoiler,
    },
  }
}

/** Create a video block, uploading the given file */
export function video(
  file: string | tl.TypeInputDocument | InputMediaVideo,
  params: {
    caption?: InputRichText | InputPageCaption
    autoplay?: boolean
    loop?: boolean
    spoiler?: boolean
  } = {},
): InputPageBlockWithFile {
  return {
    file,
    block: {
      _: 'pageBlockVideo',
      videoId: Long.ZERO,
      caption: normalizeCaption(params.caption),
      autoplay: params.autoplay,
      loop: params.loop,
      spoiler: params.spoiler,
    },
  }
}

/** Create an audio block, uploading the given file */
export function audio(
  file: string | tl.TypeInputDocument | InputMediaAudio,
  params: { caption?: InputRichText | InputPageCaption } = {},
): InputPageBlockWithFile {
  return {
    file,
    block: {
      _: 'pageBlockAudio',
      audioId: Long.ZERO,
      caption: normalizeCaption(params.caption),
    },
  }
}
