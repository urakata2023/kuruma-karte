'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Global Error Boundary（Next.js App Router）
 * Server Action のエラーなど予期しない例外時に「真っ白画面」を防ぐ。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="text-5xl">⚠️</div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            問題が発生しました
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            申し訳ありません、処理中にエラーが発生しました。
            <br />
            もう一度お試しいただくか、しばらく経ってからアクセスしてください。
          </p>
        </div>
        <div className="rounded-md bg-zinc-50 px-4 py-3 text-left text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <p className="break-words font-mono">{error.message || 'Unknown error'}</p>
          {error.digest && (
            <p className="mt-1 text-zinc-400">ID: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            もう一度試す
          </button>
          <Link
            href="/"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            トップへ戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
