'use client'

import { useState } from 'react'

export function ShareButton({
  url,
  title,
  text,
}: {
  url: string
  title: string
  text?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({ url, title, text })
        return
      } catch {
        // ユーザーがキャンセル → そのまま終了
        return
      }
    }
    // フォールバック：URLをクリップボードへコピー
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 何もしない
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-black dark:hover:bg-zinc-900"
    >
      {copied ? '✓ URLをコピーしました' : '🔗 シェアする'}
    </button>
  )
}
