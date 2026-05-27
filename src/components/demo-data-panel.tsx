'use client'

import { useState, useTransition } from 'react'
import { seedDemoData, clearDemoData } from '@/app/(app)/dashboard/demo-actions'

/**
 * デモデータ投入/削除パネル (Phase A-1)
 *
 * リハーサルとツーリング会場で「空っぽの管理画面」を見せないために、
 * 1クリックで顧客3名+車両3台+整備記録5件+ツーリング2件を投入する。
 * 削除も1クリック (名前に「(デモ)」が含まれる顧客だけ消す)。
 */
export function DemoDataPanel() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    ok?: true
    error?: string
    summary?: {
      customers: number
      vehicles: number
      maintenance: number
      tourings: number
      demoMyPageToken: string
    }
    removed?: number
  } | null>(null)

  function handleSeed() {
    setResult(null)
    startTransition(async () => {
      const r = await seedDemoData()
      setResult(r as typeof result)
    })
  }

  function handleClear() {
    if (
      !confirm(
        'デモデータ（名前に「(デモ)」が含まれる顧客とその関連記録）を全て削除します。よろしいですか？'
      )
    )
      return
    setResult(null)
    startTransition(async () => {
      const r = await clearDemoData()
      setResult(r as typeof result)
    })
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            🎬 デモ/リハーサル用パネル
          </p>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
            ツーリング当日や商談前に「画面が空っぽ」だと魅力が伝わりません。
            ワンクリックで現実っぽいデータを入れて、終わったら掃除できます。
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSeed}
          disabled={pending}
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? '処理中…' : '✨ デモデータを投入'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={pending}
          className="rounded-md border border-amber-600 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:bg-zinc-900 dark:text-amber-300"
        >
          {pending ? '処理中…' : '🧹 デモデータを削除'}
        </button>
      </div>

      {result?.error && (
        <p className="mt-3 rounded-md bg-red-100 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          ⚠️ {result.error}
        </p>
      )}

      {result?.ok && result.summary && (
        <div className="mt-3 space-y-2 rounded-md bg-white px-3 py-3 text-xs dark:bg-zinc-900">
          <p className="font-semibold">
            ✓ 投入完了：顧客 {result.summary.customers}名 / 車両{' '}
            {result.summary.vehicles}台 / 整備記録{' '}
            {result.summary.maintenance}件 / ツーリング{' '}
            {result.summary.tourings}件
          </p>
          <p>
            <span className="text-zinc-500">デモ用マイページ：</span>
            <a
              href={`/my/${result.summary.demoMyPageToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline dark:text-blue-400"
            >
              佐藤健太さん（ロードスター）の画面を開く →
            </a>
          </p>
        </div>
      )}

      {result?.ok && typeof result.removed === 'number' && !result.summary && (
        <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs dark:bg-zinc-900">
          ✓ デモ顧客 {result.removed}名 と関連レコードを削除しました
        </p>
      )}
    </div>
  )
}
