'use client'

import { useEffect } from 'react'

/**
 * 公開登録ページ (/r/[token]) 配下のError Boundary。
 * 管理者向けTOPに飛ばさない。再試行ボタンのみ提供。
 */
export default function PublicRegistrationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Public registration error:', error)
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
            登録の処理中にエラーが発生しました。
            <br />
            「もう一度試す」を押すか、しばらく経ってから再度アクセスしてください。
            <br />
            それでも続く場合は、お店の方にお問い合わせください。
          </p>
        </div>

        {error.digest && (
          <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            エラーコード: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          もう一度試す
        </button>
      </div>
    </div>
  )
}
