export function guessFileMime(chunk: Uint8Array): string | null {
  if (chunk.length < 12) return null

  // 2-byte magic numbers
  const b0 = chunk[0]
  const b1 = chunk[1]
  if (b0 === 0x42 && b1 === 0x4D) return 'image/bmp'
  if (b0 === 0x4D && b1 === 0x5A) return 'application/x-msdownload'
  if (b0 === 0x1F && (b1 === 0x9D || b1 === 0xA0)) return 'application/x-compress'
  if (b0 === 0x1F && b1 === 0x8B) return 'application/gzip'

  // 3-byte magic numbers
  const b2 = chunk[2]
  if (b0 === 0x42 && b1 === 0x5A && b2 === 0x68) return 'application/x-bzip2'
  if (b0 === 0x49 && b1 === 0x44 && b2 === 0x33) return 'audio/mpeg' // ID3v2
  if (b0 === 0xFF && (b1 === 0xFB || b1 === 0xF3 || b1 === 0xF2)) return 'audio/mpeg'

  // 4-byte magic numbers
  const b3 = chunk[3]
  if (b0 === 0x50 && b1 === 0x4B && b2 === 0x03 && b3 === 0x04) return 'application/zip'
  if (b0 === 0x38 && b1 === 0x42 && b2 === 0x50 && b3 === 0x53) return 'image/vnd.adobe.photoshop'
  if (b0 === 0x7F && b1 === 0x45 && b2 === 0x4C && b3 === 0x46) return 'application/x-elf'
  if (b0 === 0xFE && b1 === 0xED && b2 === 0xFA && b3 === 0xCF) return 'application/x-mach-binary'
  if (b0 === 0x28 && b1 === 0xB5 && b2 === 0x2F && b3 === 0xFD) return 'application/zstd'
  if (b0 === 0x66 && b1 === 0x4C && b2 === 0x61 && b3 === 0x43) return 'audio/x-flac'

  if (b0 === 0xFF && b1 === 0xD8 && b2 === 0xFF && (b3 === 0xDB || b3 === 0xE0 || b3 === 0xEE || b3 === 0xE1)) {
    return 'image/jpeg'
  }

  // OggS
  if (b0 === 0x4F && b1 === 0x67 && b2 === 0x67 && b3 === 0x53) {
    // 28-36 bytes: type
    if (chunk.length > 36) {
      const type = String.fromCharCode(...chunk.subarray(28, 36))
      if (type === 'OpusHead') return 'audio/ogg' // not audio/opus because Telegram is dumb
      if (type.startsWith('\x80theora')) return 'video/ogg'
      if (type.startsWith('\x01video')) return 'video/ogg'
      if (type.startsWith('\x7FFLAC')) return 'audio/ogg'
      if (type.startsWith('Speex  ')) return 'audio/ogg'
      if (type.startsWith('\x01vorbis')) return 'audio/ogg'
    }

    return 'application/ogg'
  }

  // 5-byte magic numbers
  const b4 = chunk[4]
  if (b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46 && b4 === 0x2D) return 'application/pdf'

  // 6-byte magic numbers
  const b5 = chunk[5]

  if (b0 === 0x47 && b1 === 0x49 && b2 === 0x46 && b3 === 0x38) {
    if ((b4 === 0x37 || b4 === 0x39) && b5 === 0x61) return 'image/gif'
  }
  if (b0 === 0x37 && b1 === 0x7A && b2 === 0xBC && b3 === 0xAF && b4 === 0x27 && b5 === 0x1C) {
    return 'application/x-7z-compressed'
  }

  // 8-byte magic numbers
  const b6 = chunk[6]
  const b7 = chunk[7]

  if (
    b0 === 0x89
    && b1 === 0x50
    && b2 === 0x4E
    && b3 === 0x47
    && b4 === 0x0D
    && b5 === 0x0A
    && b6 === 0x1A
    && b7 === 0x0A
  ) {
    return 'image/png'
  }

  if (b0 === 0x52 && b1 === 0x61 && b2 === 0x72 && b3 === 0x21 && b4 === 0x1A && b5 === 0x07) {
    if (b6 === 0x00 || b6 === 0x01) return 'application/x-rar-compressed'
  }

  // ftyp - iso container
  if (b4 === 0x66 && b5 === 0x74 && b6 === 0x79 && b7 === 0x70 && chunk[8] & 0x60) {
    const brandMajor = String.fromCharCode(...chunk.subarray(8, 12))
      .replace(/\0/g, ' ')
      .trim()

    switch (brandMajor) {
      case 'avif':
      case 'avis':
        return 'image/avif'
      case 'mif1':
        return 'image/heif'
      case 'msf1':
        return 'image/heif-sequence'
      case 'heic':
      case 'heix':
        return 'image/heic'
      case 'hevc':
      case 'hevx':
        return 'image/heic-sequence'
      case 'qt':
        return 'video/quicktime'
      case 'M4V':
      case 'M4VH':
      case 'M4VP':
        return 'video/x-m4v'
      case 'M4A':
        return 'audio/x-m4a'
      case 'M4B':
      case 'F4A':
      case 'F4B':
        return 'audio/mp4'
      case 'crx':
        return 'image/x-canon-cr3'
      default:
        if (brandMajor.startsWith('3g')) {
          if (brandMajor.startsWith('3g2')) {
            return 'video/3gpp2'
          }

          return 'video/3gpp'
        }

        return 'video/mp4'
    }
  }

  return null
}

export const MIME_TO_EXTENSION: Record<string, string | undefined> = {
  'image/bmp': 'bmp',
  'application/x-msdownload': 'exe',
  'application/x-compress': 'z',
  'application/gzip': 'gz',
  'application/x-bzip2': 'bz2',
  'audio/mpeg': 'mp3',
  'application/zip': 'zip',
  'image/vnd.adobe.photoshop': 'psd',
  'application/zstd': 'zst',
  'audio/x-flac': 'flac',
  'image/jpeg': 'jpg',
  'audio/ogg': 'ogg',
  'video/ogg': 'ogv',
  'application/ogg': 'ogg',
  'application/pdf': 'pdf',
  'image/gif': 'gif',
  'application/x-7z-compressed': '7z',
  'image/png': 'png',
  'application/x-rar-compressed': 'rar',
  'image/avif': 'avif',
  'image/heif': 'heif',
  'image/heif-sequence': 'heif',
  'image/heic': 'heic',
  'image/heic-sequence': 'heic',
  'video/quicktime': 'mov',
  'video/x-m4v': 'm4v',
  'audio/x-m4a': 'm4a',
  'audio/mp4': 'm4a',
  'image/x-canon-cr3': 'cr3',
  'video/3gpp2': '3g2',
  'video/3gpp': '3gp',
  'video/mp4': 'mp4',
}
