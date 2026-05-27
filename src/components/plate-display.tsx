'use client'

import { useState } from 'react'

/**
 * ナンバー表示。👁ボタンでマスク表示の切替（SNSスクショ用プライバシー対策）。
 * 数字・ひらがな・カタカナ・英字を ● に置換。地名（漢字）は残す。
 */
export function PlateDisplay({
  plate,
  className = '',
  defaultHidden = false,
}: {
  plate: string
  className?: string
  defaultHidden?: boolean
}) {
  const [hidden, setHidden] = useState(defaultHidden)

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className={hidden ? 'tracking-wider' : ''}>
        {hidden ? maskPlate(plate) : plate}
      </span>
      <button
        type="button"
        onClick={() => setHidden(!hidden)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-sm text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
        aria-label={hidden ? 'ナンバーを表示' : 'ナンバーを隠す'}
        title={
          hidden
            ? 'タップして表示'
            : 'タップして隠す（SNS共有時のプライバシー保護に）'
        }
      >
        {hidden ? '🙈' : '👁'}
      </button>
    </span>
  )
}

/**
 * ナンバー文字列をマスク：地名（漢字）は残し、数字・ひらがな・カタカナ・英字を ● に。
 */
function maskPlate(s: string): string {
  return s.replace(/[0-9０-９ぁ-ゖァ-ヶa-zA-Zａ-ｚＡ-Ｚ]/g, '●')
}
