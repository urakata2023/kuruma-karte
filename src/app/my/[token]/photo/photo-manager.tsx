'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { processVehiclePhoto } from '@/lib/image-process'
import {
  addGalleryPhoto,
  deleteGalleryPhoto,
  reorderGalleryPhoto,
  setAsHeroPhoto,
} from './actions'
import { SubmitButton } from '@/components/submit-button'
import type { VehiclePhoto } from '@/lib/types'

type State = { error?: string } | undefined

export function PhotoManager({
  token,
  heroPhotoUrl,
  photos,
}: {
  token: string
  heroPhotoUrl: string | null
  photos: VehiclePhoto[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(false)
  const [state, action] = useActionState<State, FormData>(
    addGalleryPhoto.bind(null, token) as unknown as (
      prev: State,
      formData: FormData
    ) => Promise<State>,
    undefined
  )
  const formRef = useRef<HTMLFormElement>(null)
  const [, startTransition] = useTransition()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    try {
      const processed = await processVehiclePhoto(file)
      const dt = new DataTransfer()
      dt.items.add(processed)
      e.target.files = dt.files
      // フォーム自動送信
      formRef.current?.requestSubmit()
    } catch (err) {
      console.error('写真処理失敗:', err)
    } finally {
      setProcessing(false)
    }
  }

  function handleAction(
    label: string,
    fn: () => Promise<void>
  ): () => void {
    return () => {
      if (label.includes('削除') && !confirm('この写真を削除しますか？')) return
      startTransition(async () => {
        try {
          await fn()
        } catch (e) {
          alert(e instanceof Error ? e.message : 'エラー')
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 写真追加 */}
      <form ref={formRef} action={action}>
        <input
          ref={inputRef}
          type="file"
          name="photo"
          accept="image/*,.heic,.heif"
          onChange={handleFileChange}
          className="hidden"
        />
        <SubmitButton
          type="button"
          onClick={() => inputRef.current?.click()}
          pending={processing}
          pendingLabel="アップロード中…"
          className="w-full rounded-xl border-2 border-dashed px-4 py-6 text-sm font-medium transition-colors hover:border-current disabled:opacity-50"
          style={{
            borderColor: 'var(--hairline-strong)',
            color: 'var(--ink-muted)',
          }}
        >
          📷 写真を追加する
        </SubmitButton>
        {state?.error && (
          <p className="mt-2 text-xs text-red-600">{state.error}</p>
        )}
      </form>

      {/* ヒーロー写真 */}
      {heroPhotoUrl && (
        <section>
          <p
            className="text-eyebrow mb-2"
            style={{ color: 'var(--ink-tertiary)' }}
          >
            現在のメイン写真
          </p>
          <div
            className="overflow-hidden rounded-xl border ring-2"
            style={{
              borderColor: 'var(--hairline)',
              // @ts-expect-error - CSS variable
              '--tw-ring-color':
                'color-mix(in srgb, var(--theme-accent) 40%, transparent)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroPhotoUrl}
              alt="メイン写真"
              className="block aspect-[4/3] w-full object-cover"
            />
          </div>
        </section>
      )}

      {/* ギャラリー写真リスト */}
      <section>
        <p
          className="text-eyebrow mb-2"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          ギャラリー ({photos.length}枚)
        </p>
        {photos.length === 0 ? (
          <div
            className="rounded-xl border border-dashed p-8 text-center text-sm"
            style={{
              borderColor: 'var(--hairline)',
              color: 'var(--ink-subtle)',
            }}
          >
            まだ追加された写真はありません
          </div>
        ) : (
          <ul className="space-y-3">
            {photos.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border p-3"
                style={{
                  background: 'var(--surface-1)',
                  borderColor: 'var(--hairline)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photo_url}
                  alt="ギャラリー写真"
                  className="h-16 w-20 flex-shrink-0 rounded-md object-cover"
                />
                <div className="flex-1 text-xs" style={{ color: 'var(--ink-subtle)' }}>
                  <p>{i + 1} 番目</p>
                  {i < 2 && (
                    <p
                      className="mt-0.5"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      ✓ マイページに表示中
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <IconButton
                    onClick={handleAction(
                      'up',
                      reorderGalleryPhoto.bind(null, token, p.id, 'up')
                    )}
                    disabled={i === 0}
                    title="上へ"
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    onClick={handleAction(
                      'down',
                      reorderGalleryPhoto.bind(null, token, p.id, 'down')
                    )}
                    disabled={i === photos.length - 1}
                    title="下へ"
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    onClick={handleAction(
                      'hero',
                      setAsHeroPhoto.bind(null, token, p.photo_url)
                    )}
                    title="メイン写真にする"
                  >
                    ⭐
                  </IconButton>
                  <IconButton
                    onClick={handleAction(
                      '削除',
                      deleteGalleryPhoto.bind(null, token, p.id)
                    )}
                    title="削除"
                    danger
                  >
                    🗑️
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function IconButton({
  children,
  onClick,
  disabled,
  title,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  title?: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors disabled:opacity-30"
      style={{
        borderColor: danger
          ? 'rgba(239,68,68,0.4)'
          : 'var(--hairline)',
        color: danger ? '#ef4444' : 'var(--ink-muted)',
        background: 'transparent',
      }}
    >
      {children}
    </button>
  )
}
