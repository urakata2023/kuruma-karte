import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTheme } from '@/lib/themes'

/**
 * お客様マイページ用の動的 PWA Manifest (Phase M+)
 *
 * GET /api/manifest/[token]
 *
 * - start_url / scope を /my/[token] に固定
 *   → ホーム画面に追加して開いたとき、必ず該当マイページが開く
 * - 名前は「車種 - 店舗名」、テーマカラーは shop.theme から
 * - アイコンは PWA 標準パスを参照
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: vehicle } = await admin
    .from('vehicles')
    .select('model, plate_number, shop_id')
    .eq('view_token', token)
    .maybeSingle<{
      model: string | null
      plate_number: string | null
      shop_id: string
    }>()

  if (!vehicle) {
    return NextResponse.json(
      { error: 'vehicle not found' },
      { status: 404 }
    )
  }

  const { data: shop } = await admin
    .from('shops')
    .select('name, theme')
    .eq('id', vehicle.shop_id)
    .maybeSingle<{ name: string; theme: string }>()

  const theme = getTheme(shop?.theme)
  const shopName = shop?.name ?? 'くるまカルテ'
  const model = vehicle.model ?? '愛車'

  const manifest = {
    name: `${model} | ${shopName}`,
    short_name: model.length > 12 ? model.slice(0, 12) : model,
    description: `${shopName} に登録の ${model} のマイページ`,
    start_url: `/my/${token}`,
    scope: `/my/${token}`,
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: theme.preview.bg,
    theme_color: theme.preview.bg,
    lang: 'ja',
    icons: [
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    categories: ['automotive', 'lifestyle'],
  }

  return new NextResponse(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  })
}
