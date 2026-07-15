import type { tl } from '../../tl/index.js'
import { assertNever } from '../../types/utils.js'

export interface PageBlockVisitor {
  /** Called for every rich text node in the tree */
  richText?: (text: tl.TypeRichText) => void
  /** Called for every page block in the tree */
  pageBlock?: (block: tl.TypePageBlock) => void
}

function walkRichText(text: tl.TypeRichText | undefined, visitor: PageBlockVisitor): void {
  if (!text) return

  visitor.richText?.(text)

  switch (text._) {
    case 'textEmpty':
    case 'textPlain':
    case 'textEmail':
    case 'textPhone':
    case 'textImage':
    case 'textMath':
    case 'textCustomEmoji':
      break
    case 'textBold':
    case 'textItalic':
    case 'textUnderline':
    case 'textStrike':
    case 'textFixed':
    case 'textUrl':
    case 'textSubscript':
    case 'textSuperscript':
    case 'textMarked':
    case 'textAnchor':
    case 'textSpoiler':
    case 'textMention':
    case 'textHashtag':
    case 'textBotCommand':
    case 'textCashtag':
    case 'textAutoUrl':
    case 'textAutoEmail':
    case 'textAutoPhone':
    case 'textBankCard':
    case 'textDate':
    case 'textMentionName':
      walkRichText(text.text, visitor)
      break
    case 'textConcat':
      for (const child of text.texts) walkRichText(child, visitor)
      break
    case 'textDiff':
      walkRichText(text.text, visitor)
      walkRichText(text.oldText, visitor)
      break
    default:
      assertNever(text)
  }
}

function walkPageCaption(caption: tl.RawPageCaption | undefined, visitor: PageBlockVisitor): void {
  if (!caption) return

  walkRichText(caption.text, visitor)
  walkRichText(caption.credit, visitor)
}

function walkPageBlock(block: tl.TypePageBlock | undefined, visitor: PageBlockVisitor): void {
  if (!block) return

  visitor.pageBlock?.(block)

  switch (block._) {
    case 'pageBlockUnsupported':
    case 'pageBlockDivider':
    case 'pageBlockAnchor':
    case 'pageBlockMath':
      break
    case 'pageBlockTitle':
    case 'pageBlockSubtitle':
    case 'pageBlockHeader':
    case 'pageBlockSubheader':
    case 'pageBlockParagraph':
    case 'pageBlockPreformatted':
    case 'pageBlockFooter':
    case 'pageBlockKicker':
    case 'pageBlockThinking':
    case 'pageBlockHeading1':
    case 'pageBlockHeading2':
    case 'pageBlockHeading3':
    case 'pageBlockHeading4':
    case 'pageBlockHeading5':
    case 'pageBlockHeading6':
      walkRichText(block.text, visitor)
      break
    case 'pageBlockAuthorDate':
      walkRichText(block.author, visitor)
      break
    case 'pageBlockList':
      for (const item of block.items) {
        switch (item._) {
          case 'pageListItemText':
            walkRichText(item.text, visitor)
            break
          case 'pageListItemBlocks':
            for (const block of item.blocks) walkPageBlock(block, visitor)
            break
          default:
            assertNever(item)
        }
      }
      break
    case 'pageBlockOrderedList':
      for (const item of block.items) {
        switch (item._) {
          case 'pageListOrderedItemText':
            walkRichText(item.text, visitor)
            break
          case 'pageListOrderedItemBlocks':
            for (const block of item.blocks) walkPageBlock(block, visitor)
            break
          default:
            assertNever(item)
        }
      }
      break
    case 'pageBlockBlockquote':
    case 'pageBlockPullquote':
      walkRichText(block.text, visitor)
      walkRichText(block.caption, visitor)
      break
    case 'pageBlockPhoto':
    case 'pageBlockVideo':
    case 'pageBlockEmbed':
    case 'pageBlockAudio':
    case 'pageBlockMap':
    case 'inputPageBlockMap':
      walkPageCaption(block.caption, visitor)
      break
    case 'pageBlockCover':
      walkPageBlock(block.cover, visitor)
      break
    case 'pageBlockEmbedPost':
      for (const child of block.blocks) walkPageBlock(child, visitor)
      walkPageCaption(block.caption, visitor)
      break
    case 'pageBlockCollage':
    case 'pageBlockSlideshow':
      for (const child of block.items) walkPageBlock(child, visitor)
      walkPageCaption(block.caption, visitor)
      break
    case 'pageBlockChannel':
      break
    case 'pageBlockTable':
      walkRichText(block.title, visitor)
      for (const row of block.rows) {
        for (const cell of row.cells) walkRichText(cell.text, visitor)
      }
      break
    case 'pageBlockDetails':
      for (const child of block.blocks) walkPageBlock(child, visitor)
      walkRichText(block.title, visitor)
      break
    case 'pageBlockRelatedArticles':
      walkRichText(block.title, visitor)
      break
    case 'pageBlockBlockquoteBlocks':
      for (const child of block.blocks) walkPageBlock(child, visitor)
      walkRichText(block.caption, visitor)
      break
    default:
      assertNever(block)
  }
}

/** Recursively walk a list of page blocks, invoking the given visitor callbacks */
export function walkPageBlocks(blocks: tl.TypePageBlock[], visitor: PageBlockVisitor): void {
  for (const block of blocks) walkPageBlock(block, visitor)
}
