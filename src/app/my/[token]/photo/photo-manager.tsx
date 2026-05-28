'use client'

import {
  useActionState,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react'
import Link from 'next/link'
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

type OptimisticAction =
  | { type: 'reorder'; id: string; direction: 'up' | 'down' }
  | { type: 'delete'; id: string }
  | { type: 'set-hero'; id: string }

export function PhotoManager({
  token,
  heroPhotoUrl,
  photos: initialPhotos,
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
  const [optimisticHeroUrl, setOptimisticHeroUrl] = useState(heroPhotoUrl)

  // 楽観的並び替え (即時反映)
  const [optimisticPhotos, applyOptimistic] = useOptimistic<
    VehiclePhoto[],
    OptimisticAction
  >(initialPhotos, (current, act) => {
    if (act.type === 'reorder') {
      const idx = current.findIndex((p) => p.id === act.id)
      const swapIdx = act.direction === 'up' ? idx - 1 : idx + 1
      if (idx < 0 || swapIdx < 0 || swapIdx >= current.length) return current
      const next = [...current]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    }
    if (act.type === 'delete') {
      return current.filter((p) => p.id !== act.id)
    }
    return current
  })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    try {
      const processed = await processVehiclePhoto(file)
      const dt = new DataTransfer()
      dt.items.add(processed)
      e.target.files = dt.files
      formRef.current?.requestSubmit()
    } catch (err) {
      console.error('写真処理失敗:', err)
    } finally {
      setProcessing(false)
    }
  }

  // View Transition でブラウザネイティブの並び替えアニメ
  function withViewTransition(fn: () => void) {
    if (
      typeof document !== 'undefined' &&
      typeof (document as Document & { startViewTransition?: unknown })
        .startViewTransition === 'function'
    ) {
      ;(
        document as unknown as {
          startViewTransition: (cb: () => void) => void
        }
      ).startViewTransition(fn)
    } else {
      fn()
    }
  }

  function handleReorder(id: string, direction: 'up' | 'down') {
    startTransition(() => {
      withViewTransition(() => {
        applyOptimistic({ type: 'reorder', id, direction })
      })
      // 裏で DB 更新 (失敗時はリロードで巻き戻る)
      reorderGalleryPhoto(token, id, direction).catch((e) =>
        console.error('reorder failed:', e)
      )
    })
  }

  function handleDelete(id: string) {
    if (!confirm('この写真を削除しますか？')) return
    startTransition(() => {
      withViewTransition(() => {
        applyOptimistic({ type: 'delete', id })
      })
      deleteGalleryPhoto(token, id).catch((e) =>
        console.error('delete failed:', e)
      )
    })
  }

  function handleSetHero(photoUrl: string, id: string) {
    startTransition(() => {
      setOptimisticHeroUrl(photoUrl) // ヒーロー写真も即時更新
      applyOptimistic({ type: 'set-hero', id }) // 並びは変えない
      setAsHeroPhoto(token, photoUrl).catch((e) =>
        console.error('set hero failed:', e)
      )
    })
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
      {optimisticHeroUrl && (
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
              viewTransitionName: 'hero-photo',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={optimisticHeroUrl}
              alt="メイン写真"
              className="block aspect-[4/3] w-full object-cover transition-opacity duration-200"
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
          ギャラリー ({optimisticPhotos.length}枚)
        </p>
        {optimisticPhotos.length === 0 ? (
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
            {optimisticPhotos.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border p-3"
                style={{
                  background: 'var(--surface-1)',
                  borderColor: 'var(--hairline)',
                  // View Transition で個別要素の位置移動を自動アニメ
                  viewTransitionName: `photo-${p.id}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.photo_url}
                  alt="ギャラリー写真"
                  className="h-16 w-20 flex-shrink-0 rounded-md object-cover"
                />
                <div
                  className="flex-1 text-xs"
                  style={{ color: 'var(--ink-subtle)' }}
                >
                  <p className="tabular-figs">{i + 1} 番目</p>
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
                    onClick={() => handleReorder(p.id, 'up')}
                    disabled={i === 0}
                    title="上へ"
                  >
                    ↑
                  </IconButton>
                  <IconButton
                    onClick={() => handleReorder(p.id, 'down')}
                    disabled={i === optimisticPhotos.length - 1}
                    title="下へ"
                  >
                    ↓
                  </IconButton>
                  <IconButton
                    onClick={() => handleSetHero(p.photo_url, p.id)}
                    title="メイン写真にする"
                  >
                    ⭐
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(p.id)}
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

      {/* 確定 CTA (大型・スマホで親指届く位置) */}
      <div className="sticky bottom-4 pt-4">
        <Link
          href={`/my/${token}`}
          className="block w-full rounded-xl px-4 py-4 text-center text-base font-semibold shadow-2xl backdrop-blur-md transition-transform active:scale-[0.98]"
          style={{
            background: 'var(--theme-primary)',
            color: 'var(--theme-primary-fg)',
            border: '1px solid color-mix(in srgb, var(--theme-accent) 30%, transparent)',
          }}
        >
          ✓ 確定してマイページへ戻る
        </Link>
        <p
          className="mt-2 text-center text-[10px]"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          変更は自動で保存されています
        </p>
      </div>
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-base transition-all active:scale-90 disabled:opacity-30"
      style={{
        borderColor: danger ? 'rgba(239,68,68,0.4)' : 'var(--hairline)',
        color: danger ? '#ef4444' : 'var(--ink-muted)',
        background: 'transparent',
      }}
    >
      {children}
    </button>
  )
}
