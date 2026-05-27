'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'

/**
 * お客様マイページ (/my/[token]) 配下のError Boundary。
 * 管理者向けTOP (/) に飛ばさないよう、戻り先はマイページに限定。
 * 技術メッセージは出さず、お客様向けの文言で案内する。
 */
export default function OwnerMyPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams<{ token: string }>()

  useEffect(() => {
    // ログだけ残す（お客様には見せない）
    console.error('MyPage error:', error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="text-5xl">⚠️</div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            一時的な問題が発生しました
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            ページの表示中にエラーが発生しました。
            <br />
            「もう一度試す」を押してみてください。
            <br />
            それでも続く場合は、お店の方にお問い合わせください。
          </p>
        </div>

        {error.digest && (
          <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            エラーコード: {error.digest}
          </p>
        )}

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            もう一度試す
          </button>
          {params?.token && (
            <Link
              href={`/my/${params.token}`}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              マイページに戻る
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
