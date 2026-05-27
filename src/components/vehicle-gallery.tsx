import type { VehiclePhoto } from '@/lib/types'

/**
 * 愛車のギャラリー表示。CSSスナップで横スワイプ可能。
 * 画像が0枚なら表示しない。
 */
export function VehicleGallery({
  photos,
  heroPhotoUrl,
}: {
  photos: VehiclePhoto[]
  heroPhotoUrl?: string | null
}) {
  // ヒーロー写真 + ギャラリー写真を結合して一覧表示
  // （ヒーローは重複しないよう sort_order=0 として先頭に）
  type Item = { id: string; url: string; caption: string | null }
  const items: Item[] = []
  if (heroPhotoUrl) {
    items.push({ id: 'hero', url: heroPhotoUrl, caption: null })
  }
  for (const p of photos) {
    items.push({ id: p.id, url: p.photo_url, caption: p.caption })
  }

  if (items.length === 0) return null
  if (items.length === 1) return null // ヒーロー1枚だけならギャラリーは隠す

  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-6">
      <h2 className="mb-3 text-base font-semibold">愛車ギャラリー</h2>
      <div className="-mx-6 overflow-x-auto px-6 pb-2">
        <div className="flex snap-x snap-mandatory gap-3">
          {items.map((it) => (
            <figure
              key={it.id}
              className="relative w-[80%] flex-shrink-0 snap-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.url}
                alt={it.caption ?? '愛車'}
                className="aspect-[4/3] w-full rounded-xl object-cover"
              />
              {it.caption && (
                <figcaption className="mt-2 text-xs text-zinc-500">
                  {it.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
      <p className="mt-1 text-center text-xs text-zinc-400">
        ← スワイプで他の写真も見られます →
      </p>
    </section>
  )
}
