import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const alt = 'くるまカルテ - あなたの愛車のマイページ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({
  params,
}: {
  params: { token: string }
}) {
  const admin = createAdminClient()
  const { data: vehicle } = await admin
    .from('vehicles')
    .select(
      'model, plate_number, photo_url, inspection_expires_on, customer_id, shop_id'
    )
    .eq('view_token', params.token)
    .maybeSingle()

  if (!vehicle) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: 'white',
            fontSize: 60,
          }}
        >
          くるまカルテ
        </div>
      ),
      { ...size }
    )
  }

  const [customerR, shopR] = await Promise.all([
    admin
      .from('customers')
      .select('name')
      .eq('id', vehicle.customer_id)
      .maybeSingle(),
    admin
      .from('shops')
      .select('name')
      .eq('id', vehicle.shop_id)
      .maybeSingle(),
  ])

  const customerName = customerR.data?.name ?? 'お客様'
  const shopName = shopR.data?.name ?? '車屋'

  let daysToInspection: number | null = null
  if (vehicle.inspection_expires_on) {
    const target = new Date(vehicle.inspection_expires_on)
    const today = new Date()
    target.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    daysToInspection = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #18181b 0%, #3f3f46 100%)',
          color: 'white',
          padding: '60px',
        }}
      >
        {/* 左：愛車写真 */}
        <div
          style={{
            display: 'flex',
            width: '500px',
            height: '510px',
            borderRadius: '24px',
            overflow: 'hidden',
            marginRight: '40px',
            background: '#27272a',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {vehicle.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img
              src={vehicle.photo_url}
              width="500"
              height="510"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{ fontSize: 120, display: 'flex' }}>🚗</div>
          )}
        </div>

        {/* 右：テキスト */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 24, color: '#a1a1aa', marginBottom: 8 }}>
              {shopName}
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                marginBottom: 4,
                display: 'flex',
              }}
            >
              {customerName} さんの
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1.1,
                display: 'flex',
              }}
            >
              {vehicle.model ?? 'お車'}
            </div>
            {vehicle.plate_number && (
              <div style={{ fontSize: 22, color: '#d4d4d8', marginTop: 8 }}>
                {vehicle.plate_number}
              </div>
            )}
          </div>

          {daysToInspection != null && daysToInspection >= 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#fbbf24',
                color: '#18181b',
                padding: '20px 28px',
                borderRadius: 16,
                marginTop: 20,
                alignSelf: 'flex-start',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                次回車検まで
              </div>
              <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>
                あと {daysToInspection} 日
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-end',
              fontSize: 22,
              color: '#a1a1aa',
              marginTop: 20,
            }}
          >
            くるまカルテ
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
