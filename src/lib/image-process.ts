'use client'

import imageCompression from 'browser-image-compression'

/**
 * 画像ファイルを「マイページ表示に最適な形」に整える：
 * 1. HEIC/HEIF（iPhoneデフォルト）を JPEG に変換
 * 2. 1MB以下 / 長辺1920px以下に圧縮
 *
 * heic2any はクライアント専用なので dynamic import。
 */
export async function processVehiclePhoto(file: File): Promise<File> {
  // 1. HEIC/HEIF判定
  const isHeic =
    /image\/(heic|heif)/i.test(file.type) ||
    /\.(heic|heif)$/i.test(file.name)

  let workingFile: File = file

  if (isHeic) {
    // dynamic import でSSRバンドルを汚さない
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.85,
    })
    const blob = Array.isArray(converted) ? converted[0] : converted
    workingFile = new File(
      [blob],
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    )
  }

  // 2. 圧縮（既にJPEGならそのまま、HEIC由来でも再圧縮）
  const compressed = await imageCompression(workingFile, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  })

  return new File([compressed], compressed.name, { type: compressed.type })
}
