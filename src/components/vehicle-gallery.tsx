'use client'

import { useRef, useState } from 'react'
import type { VehiclePhoto } from '@/lib/types'

/**
 * 愛車のギャラリー表示 (Phase L - B 強化版)
 *
 * - Instagram風のスワイプUI
 * - ドットインジケーター
 * - タップで全画面拡大表示
 * - スワイプ位置検出
 */
export function VehicleGallery({
  photos,
  heroPhotoUrl,
}: {
  photos: VehiclePhoto[]
  heroPhotoUrl?: string | null
}) {
  type Item = { id: string; url: string; caption: string | null }
  const items: Item[] = []
  if (heroPhotoUrl) {
    items.push({ id: 'hero', url: heroPhotoUrl, caption: null })
  }
  for (const p of photos) {
    items.push({ id: p.id, url: p.photo_url, caption: p.caption })
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (items.length === 0) return null
  if (items.length === 1) return null

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const slideWidth = el.clientWidth * 0.85 + 12 // 80%幅 + gap
    const idx = Math.round(el.scrollLeft / slideWidth)
    if (idx !== activeIdx) setActiveIdx(idx)
  }

  return (
    <>
      <section className="mx-auto w-full max-w-2xl px-6 py-6">
        <div className="flex items-center justify-between">
          <h2
            className="text-title"
            style={{ color: 'var(--ink)' }}
          >
            愛車ギャラリー
          </h2>
          <p
            className="text-xs tabular-figs"
            style={{ color: 'var(--ink-subtle)' }}
          >
            {activeIdx + 1} / {items.length}
          </p>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="-mx-6 mt-3 overflow-x-auto px-6 pb-2 scrollbar-hide"
        >
          <div className="flex snap-x snap-mandatory gap-3">
            {items.map((it, i) => (
              <figure
                key={it.id}
                className="relative w-[85%] flex-shrink-0 snap-center"
              >
                <button
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="block w-full overflow-hidden rounded-2xl"
                  aria-label="拡大表示"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={it.url}
                    alt={it.caption ?? '愛車'}
                    className="aspect-[4/3] w-full object-cover transition-transform hover:scale-[1.02]"
                  />
                </button>
                {it.caption && (
                  <figcaption
                    className="mt-2 text-xs"
                    style={{ color: 'var(--ink-subtle)' }}
                  >
                    {it.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>

        {/* ドットインジケーター */}
        <div className="mt-3 flex justify-center gap-1.5">
          {items.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === activeIdx ? '24px' : '6px',
                background:
                  i === activeIdx
                    ? 'var(--theme-accent)'
                    : 'color-mix(in srgb, var(--ink) 20%, transparent)',
              }}
            />
          ))}
        </div>
      </section>

      {/* ライトボックス (全画面表示) */}
      {lightbox !== null && (
        <button
          type="button"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          aria-label="閉じる"
        >
          <div className="relative max-h-full max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items[lightbox].url}
              alt={items[lightbox].caption ?? '愛車'}
              className="max-h-[90vh] max-w-full object-contain"
            />
            {items[lightbox].caption && (
              <p className="mt-3 text-center text-sm text-white">
                {items[lightbox].caption}
              </p>
            )}
            <span className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
              ✕ タップで閉じる
            </span>
          </div>
        </button>
      )}
    </>
  )
}
