import { NextResponse } from 'next/server'
import { extractCertificateFromImage } from '@/lib/cert-ocr'

/**
 * 車検証画像の OCR エンドポイント。
 * Vision API (Claude) で構造化抽出して JSON で返す。
 *
 * POST multipart/form-data:
 *  - image: File (jpg/png/heic)
 *
 * 認証は現状なし（公開登録フォームからも叩くため）。
 * 将来的にレート制限を入れる余地あり。
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('image')
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: '画像が指定されていません' },
        { status: 400 }
      )
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: '画像サイズは20MB以下にしてください' },
        { status: 413 }
      )
    }

    const result = await extractCertificateFromImage(file)
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('cert-scan error:', msg, e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
