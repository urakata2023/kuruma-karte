import 'server-only'
import sharp from 'sharp'

/**
 * Server側で画像を「アップロード用JPEG」に整える。
 *
 * - HEIC/HEIF を heic-convert で JPEG 化（iPhone対策・libheifバンドル）
 * - EXIF回転を反映、長辺1920px以下にリサイズ
 * - mozjpeg quality 85 で圧縮
 *
 * クライアント側の image-process.ts と二重防衛。
 * iPhone Safari など、クライアント変換が失敗してもサーバーで救う。
 */
export async function processImageServerSide(file: File): Promise<{
  buffer: Buffer
  ext: 'jpg'
  contentType: 'image/jpeg'
}> {
  const arrayBuffer = await file.arrayBuffer()
  let buf: Buffer = Buffer.from(arrayBuffer)

  const isHeic =
    /image\/(heic|heif)/i.test(file.type) ||
    /\.(heic|heif)$/i.test(file.name)

  if (isHeic) {
    const convert = (await import('heic-convert')).default
    const jpegBuf = await convert({
      buffer: buf as unknown as ArrayBufferLike,
      format: 'JPEG',
      quality: 0.85,
    })
    buf = Buffer.from(jpegBuf)
  }

  const processed = await sharp(buf)
    .rotate()
    .resize({
      width: 1920,
      height: 1920,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()

  return { buffer: processed, ext: 'jpg', contentType: 'image/jpeg' }
}
