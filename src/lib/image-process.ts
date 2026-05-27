'use client'

import imageCompression from 'browser-image-compression'

/**
 * 画像ファイルを「マイページ表示に最適な形」に整える：
 * 1. HEIC/HEIF（iPhoneデフォルト）を JPEG に変換
 *    - heic-to (libheif-js最新) を使用。古い heic2any より対応形式が広い
 * 2. 1MB以下 / 長辺1920px以下に圧縮
 */
export async function processVehiclePhoto(file: File): Promise<File> {
  let workingFile: File = file

  // ファイル先頭バイトで判定（拡張子/typeより堅牢）
  const heicMod = await import('heic-to')
  const isHeic = await heicMod.isHeic(file).catch(() => false)

  if (isHeic) {
    const jpegBlob = await heicMod.heicTo({
      blob: file,
      type: 'image/jpeg',
      quality: 0.85,
    })
    workingFile = new File(
      [jpegBlob],
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    )
  }

  // 圧縮（JPEG/PNG/WebP も対象）
  const compressed = await imageCompression(workingFile, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  })

  return new File([compressed], compressed.name, { type: compressed.type })
}
