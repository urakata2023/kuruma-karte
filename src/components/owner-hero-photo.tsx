'use client'

import { useRef, useState, useTransition } from 'react'
import { processVehiclePhoto } from '@/lib/image-process'
import { updateVehiclePhotoByToken } from '@/app/my/[token]/photo/actions'
import { LoadingOverlay } from '@/components/loading-overlay'

/**
 * マイページのヒーロー写真エリア。
 * - 写真未登録：タップで写真を選択 → 即アップロード → マイページへリロード
 * - 写真登録済み：写真を表示し、「写真を変更」リンクで再アップロード可能
 */
export function OwnerHeroPhoto({
  token,
  currentUrl,
  alt,
}: {
  token: string
  currentUrl: string | null
  alt: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
        if (result?.error) {
          setError(result.error)
        }
        // 成功時は Server Action 内で redirect されるのでここに到達しない
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`写真の処理に失敗: ${msg}`)
    } finally {
      setProcessing(false)
    }
  }

  const busy = processing || isPending

  if (!currentUrl) {
    // 写真未登録：プレースホルダーをタップで写真選択
    return (
      <>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-dashed border-zinc-400 bg-zinc-100 transition-colors hover:border-zinc-900 hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-white dark:hover:bg-zinc-800"
          aria-label="愛車の写真を追加"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/default-vehicle.svg"
            alt={alt}
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-[2px] dark:bg-black/40">
            {busy ? (
              <LoadingOverlay label="愛車の写真を準備中" />
            ) : (
              <>
                <div className="text-5xl">📷</div>
                <div className="text-sm font-semibold">
                  タップして愛車の写真を追加
                </div>
                <div className="text-xs text-zinc-500">
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
          <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </>
    )
  }

  // 写真登録済み：表示＋「変更」ボタン
  return (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={currentUrl} alt={alt} className="h-full w-full object-cover" />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <LoadingOverlay label="アップロード中" />
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/85 disabled:opacity-50"
        >
          📷 写真を変更
        </button>
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
        <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </>
  )
}
