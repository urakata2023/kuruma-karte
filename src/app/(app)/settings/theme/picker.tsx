'use client'

import { useActionState, useState } from 'react'
import type { ThemePreset } from '@/lib/themes'
import { updateShopTheme } from './actions'

type State = { error?: string } | undefined

/**
 * テーマ選択UI。
 * - カードクリックで「選択中」状態に変える（DB保存はせず、ローカル状態でプレビュー）
 * - 下部の「このテーマで保存」ボタンで Server Action 経由で確定
 * - 上部にライブプレビュー (data-theme をその場で当てた小さな画面) を出す
 */
export function ThemePicker({
  themes,
  currentThemeId,
}: {
  themes: ThemePreset[]
  currentThemeId: string
}) {
  const [selectedId, setSelectedId] = useState<string>(currentThemeId)
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateShopTheme,
    undefined
  )

  return (
    <div className="space-y-6">
      {/* ライブプレビュー */}
      <ThemeLivePreview themeId={selectedId} />

      {/* テーマカード一覧 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {themes.map((theme) => {
          const isSelected = selectedId === theme.id
          const isCurrent = currentThemeId === theme.id
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => setSelectedId(theme.id)}
              className={`group relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all ${
                isSelected
                  ? 'border-zinc-900 shadow-md dark:border-white'
                  : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600'
              }`}
              style={{
                background: theme.preview.bg,
                color: theme.preview.text,
              }}
            >
              {/* スウォッチ */}
              <div className="mb-3 flex gap-2">
                <span
                  className="h-6 w-6 rounded-full ring-1 ring-black/10"
                  style={{ background: theme.preview.primary }}
                  title="primary"
                />
                <span
                  className="h-6 w-6 rounded-full ring-1 ring-black/10"
                  style={{ background: theme.preview.accent }}
                  title="accent"
                />
              </div>
              <div className="font-semibold">{theme.name}</div>
              <div className="mt-1 text-xs opacity-80">{theme.tagline}</div>

              {/* バッジ */}
              <div className="absolute right-2 top-2 flex gap-1">
                {isCurrent && (
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white dark:bg-white dark:text-black">
                    現在
                  </span>
                )}
                {isSelected && !isCurrent && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
                    選択中
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* 保存フォーム */}
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="theme" value={selectedId} />

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || selectedId === currentThemeId}
          className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {pending
            ? '保存中…'
            : selectedId === currentThemeId
              ? '既に選択中のテーマです'
              : 'このテーマで保存する'}
        </button>
      </form>
    </div>
  )
}

/**
 * 選択中テーマのライブプレビュー。data-theme を当ててミニ画面を描画。
 */
function ThemeLivePreview({ themeId }: { themeId: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div
        data-theme={themeId}
        className="space-y-3 p-5"
        style={{
          background: 'var(--background)',
          color: 'var(--foreground)',
        }}
      >
        <div className="text-xs opacity-70">プレビュー</div>

        {/* ヒーロー */}
        <div
          className="rounded-lg p-4"
          style={{ background: 'var(--theme-surface)' }}
        >
          <div className="text-[10px] opacity-60">愛車情報</div>
          <div className="mt-1 text-base font-semibold">トヨタ ハリアー HEV</div>
          <div
            className="mt-1 inline-block rounded px-2 py-0.5 text-xs"
            style={{
              background: 'var(--theme-accent)',
              color: 'var(--theme-accent-fg)',
            }}
          >
            車検まで あと 365日
          </div>
        </div>

        {/* CTAボタン */}
        <button
          type="button"
          className="w-full rounded-md px-4 py-2 text-sm font-semibold"
          style={{
            background: 'var(--theme-primary)',
            color: 'var(--theme-primary-fg)',
          }}
        >
          整備記録を見る
        </button>

        {/* セカンダリ */}
        <button
          type="button"
          className="w-full rounded-md border px-4 py-2 text-sm font-medium"
          style={{
            borderColor: 'var(--theme-surface-border)',
            background: 'var(--theme-surface)',
            color: 'var(--foreground)',
          }}
        >
          愛車の写真を追加
        </button>
      </div>
    </div>
  )
}
