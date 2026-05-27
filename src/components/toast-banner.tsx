'use client'

import { useEffect, useState } from 'react'

/**
 * URLクエリパラメータ経由でServer Actionからの結果を一時的に表示するバナー。
 * 数秒後に自動で消える。
 */
export function ToastBanner({
  type,
  message,
}: {
  type: 'ok' | 'err'
  message: string
}) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 6000)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  const bg =
    type === 'ok'
      ? 'bg-green-50 border-green-300 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200'
      : 'bg-red-50 border-red-300 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'

  return (
    <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-md">
      <div
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${bg}`}
      >
        <span className="text-base">{type === 'ok' ? '✓' : '⚠️'}</span>
        <p className="flex-1 whitespace-pre-wrap">{message}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-base opacity-60 hover:opacity-100"
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
    </div>
  )
}
