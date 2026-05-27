'use client'

import imageCompression from 'browser-image-compression'

/**
 * 画像ファイルをクライアント側で軽く整える（ベストエフォート）：
 * 1. HEIC/HEIF → JPEG （heic-to / libheif-js）
 * 2. 1MB以下 / 長辺1920px以下に圧縮
 *
 * いずれの段階でも失敗した場合は元のファイル（または直前の状態）を返す。
 * 最終的な変換・圧縮はサーバー側 (image-server.ts) で再度行うため、
 * ここでクラッシュさせない方針。
 */
export async function processVehiclePhoto(file: File): Promise<File> {
  let workingFile: File = file

  // 1. HEIC変換（失敗しても元ファイルで続行）
  try {
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
  } catch (err) {
    console.warn(
      'クライアントHEIC変換に失敗、サーバー側で再処理します:',
      err instanceof Error ? err.message : err
    )
    // 元ファイルを返す（サーバー側で処理される）
    return file
  }

  // 2. 圧縮（失敗しても変換済みファイルで続行）
  try {
    const compressed = await imageCompression(workingFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    })
    return new File([compressed], compressed.name, { type: compressed.type })
  } catch (err) {
    console.warn(
      'クライアント圧縮に失敗、サーバー側で再処理します:',
      err instanceof Error ? err.message : err
    )
    return workingFile
  }
}
