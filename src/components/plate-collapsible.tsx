'use client'

import { useState } from 'react'
import { PlateDisplay } from '@/components/plate-display'

/**
 * 折りたたみ式ナンバープレート (Phase M+)
 *
 * デフォルトでは「ナンバーを表示」ボタンのみ。
 * タップでプレートがスライドダウンで現れる。
 * プライバシー重視のオーナー向け。
 */
export function PlateCollapsible({ plate }: { plate: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-2">
      {/* トグルボタン (常時表示) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all"
        style={{
          background: open
            ? 'color-mix(in srgb, var(--ink) 10%, transparent)'
            : 'transparent',
          color: 'var(--ink-subtle)',
          border: '1px solid var(--hairline)',
        }}
        aria-expanded={open}
      >
        <span>{open ? '🔓' : '🔒'}</span>
        <span>{open ? 'ナンバーを隠す' : 'ナンバーを表示'}</span>
      </button>

      {/* プレート (アニメーションで開閉) */}
      <div
        className="grid w-full transition-all duration-300 ease-out"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          opacity: open ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="flex justify-center pt-1">
            <PlateDisplay plate={plate} />
          </div>
        </div>
      </div>
    </div>
  )
}
