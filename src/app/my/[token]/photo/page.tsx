import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PhotoManager } from './photo-manager'
import type { Vehicle, VehiclePhoto } from '@/lib/types'

export const metadata = {
  title: '写真を管理 — くるまカルテ',
}

/**
 * 写真管理ページ (Phase M+)
 *
 * - ヒーロー写真 (vehicles.photo_url) の表示・差し替え
 * - ギャラリー写真 (vehicle_photos) の追加/削除/並び替え
 * - 各ギャラリー写真を「ヒーローに昇格」させる動線
 */
export default async function PhotoManagePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: vehicle } = await admin
    .from('vehicles')
    .select('*')
    .eq('view_token', token)
    .maybeSingle<Vehicle>()

  if (!vehicle) notFound()

  const { data: photosData } = await admin
    .from('vehicle_photos')
    .select('*')
    .eq('vehicle_id', vehicle.id)
    .order('sort_order', { ascending: true })

  const photos = (photosData ?? []) as VehiclePhoto[]

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <Link
        href={`/my/${token}`}
        className="text-sm hover:underline"
        style={{ color: 'var(--ink-subtle)' }}
      >
        ← マイページへ戻る
      </Link>

      <header className="mt-4 space-y-1">
        <p
          className="text-eyebrow"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          Photo Manager
        </p>
        <h1
          className="text-headline"
          style={{ color: 'var(--ink)' }}
        >
          🖼️ 写真を管理
        </h1>
        <p
          className="text-sm"
          style={{ color: 'var(--ink-subtle)' }}
        >
          愛車の写真の追加・並び替え・削除ができます。上から順にマイページの
          ヒーローエリアに最大3枚まで表示されます。
        </p>
      </header>

      <div className="mt-8">
        <PhotoManager
          token={token}
          heroPhotoUrl={vehicle.photo_url}
          photos={photos}
        />
      </div>
    </main>
  )
}
