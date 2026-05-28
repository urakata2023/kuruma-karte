'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { processVehiclePhoto } from '@/lib/image-process'
import { updateVehiclePhotoByToken } from '@/app/my/[token]/photo/actions'
import { LoadingOverlay } from '@/components/loading-overlay'

/**
 * マイページのヒーロー写真エリア (Phase M+)
 *
 * - 最大3枚をスワイプ/ドットで切替できる "気分のメイン写真" カルーセル
 * - iOS 待ち受けライクに、最後に表示してた写真を localStorage で記憶
 * - 写真変更ボタンは画像の "外" に独立配置 (画像の上に乗らない)
 *
 * 表示する写真リストの組み立ては呼び出し側 (mypage) で行い、
 * このコンポーネントは「並んだ写真を綺麗に切り替える」役に専念。
 */
export function OwnerHeroCarousel({
  token,
  photos,
  alt,
  storageKey,
}: {
  token: string
  photos: string[] // 既に組み立て済みの URL 配列 (空 = 未登録)
  alt: string
  storageKey: string // vehicle.id をキーに保存
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [progress, setProgress] = useState(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  // 最後に表示した index を localStorage から復元
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`karte-hero-idx-${storageKey}`)
      if (raw) {
        const n = parseInt(raw, 10)
        if (!isNaN(n) && n >= 0 && n < photos.length) setActiveIdx(n)
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [photos.length, storageKey])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(
        `karte-hero-idx-${storageKey}`,
        String(activeIdx)
      )
    } catch {
      // ignore
    }
  }, [activeIdx, hydrated, storageKey])

  // 擬似プログレス
  useEffect(() => {
    if (!processing && !isPending) {
      setProgress(0)
      return
    }
    setProgress(15)
    const timer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.max(1, Math.floor((90 - p) * 0.08)) : p))
    }, 200)
    return () => clearInterval(timer)
  }, [processing, isPending])

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const processed = await processVehiclePhoto(file)
      const fd = new FormData()
      fd.append('photo', processed)
      startTransition(async () => {
        const result = await updateVehiclePhotoByToken(token, undefined, fd)
        if (result?.error) setError(result.error)
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`写真の処理に失敗: ${msg}`)
    } finally {
      setProcessing(false)
    }
  }

  const busy = processing || isPending
  const hasPhotos = photos.length > 0
  const currentUrl = hasPhotos ? photos[activeIdx] ?? photos[0] : null

  // スワイプ検出
  const touchStartX = useRef<number | null>(null)
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40 && photos.length > 1) {
      if (dx < 0) setActiveIdx((i) => (i + 1) % photos.length)
      else setActiveIdx((i) => (i - 1 + photos.length) % photos.length)
    }
    touchStartX.current = null
  }

  // 写真未登録: タップで追加 (旧 UI 維持)
  if (!hasPhotos) {
    return (
      <>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-dashed transition-colors disabled:opacity-50"
          style={{
            borderColor: 'var(--hairline-strong)',
            background: 'var(--surface-2)',
          }}
          aria-label="愛車の写真を追加"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/default-vehicle.svg"
            alt={alt}
            className="h-full w-full object-cover opacity-50"
          />
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]"
            style={{ background: 'color-mix(in srgb, var(--canvas) 40%, transparent)' }}
          >
            {busy ? (
              <LoadingOverlay label="愛車の写真を準備中" progress={progress} />
            ) : (
              <>
                <div className="text-5xl">📷</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  タップして愛車の写真を追加
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-subtle)' }}>
                  iPhone(HEIC)もOK・自動でJPEG変換
                </div>
              </>
            )}
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          onChange={handleChange}
          disabled={busy}
          className="hidden"
        />
        {error && (
          <p className="mt-2 text-center text-xs text-red-600">{error}</p>
        )}
      </>
    )
  }

  return (
    <>
      {/* メイン写真 */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl ring-1"
        style={{
          // @ts-expect-error - CSS variable
          '--tw-ring-color':
            'color-mix(in srgb, var(--theme-accent) 30%, transparent)',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* スタック表示: 全画像を z-index で重ねて opacity でフェード切替 */}
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url + i}
            src={url}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            style={{
              opacity: i === activeIdx ? 1 : 0,
              pointerEvents: i === activeIdx ? 'auto' : 'none',
            }}
          />
        ))}

        {busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 text-white backdrop-blur-sm">
            <LoadingOverlay label="アップロード中" progress={progress} />
          </div>
        )}

        {/* 左右ナビボタン (2枚以上のみ) */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setActiveIdx(
                  (i) => (i - 1 + photos.length) % photos.length
                )
              }
              aria-label="前の写真"
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/60 hover:opacity-100 sm:opacity-60"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActiveIdx((i) => (i + 1) % photos.length)}
              aria-label="次の写真"
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/60 hover:opacity-100 sm:opacity-60"
            >
              ›
            </button>
          </>
        )}

        {/* ドットインジケーター (2枚以上のみ) */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIdx(i)}
                aria-label={`写真 ${i + 1}`}
                className="h-1.5 rounded-full transition-all backdrop-blur"
                style={{
                  width: i === activeIdx ? '20px' : '6px',
                  background:
                    i === activeIdx
                      ? 'rgba(255,255,255,0.95)'
                      : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 写真変更アクションバー (画像の外・下に独立配置) */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          style={{
            border: '1px solid var(--hairline)',
            color: 'var(--ink-subtle)',
            background: 'transparent',
          }}
        >
          📷 写真を変更
        </button>
        <a
          href={`/my/${token}/photo`}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
          style={{
            border: '1px solid var(--hairline)',
            color: 'var(--ink-subtle)',
          }}
        >
          🖼️ 写真を管理
        </a>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleChange}
        disabled={busy}
        className="hidden"
      />
      {error && (
        <p className="mt-2 text-center text-xs text-red-600">{error}</p>
      )}
    </>
  )
}
