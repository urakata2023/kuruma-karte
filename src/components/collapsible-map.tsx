'use client'

import { useState } from 'react'
import { TouringMap } from '@/components/touring-map'
import type { TouringRecord } from '@/lib/types'

/**
 * 折りたたみ可能なツーリングマップ。
 * 閉じている間は TouringMap を mount せず、Leafletの初期化も行わない。
 * 開いた瞬間に初めて地図描画 → サイズが確定した状態で leaflet が起動するので
 * レイアウト崩れもない。
 */
export function CollapsibleMap({
  records,
  defaultOpen = false,
}: {
  records: TouringRecord[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const validCount = records.filter(
    (r) => r.latitude != null && r.longitude != null
  ).length

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          🗺️ ツーリングマップ
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {validCount}件
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs text-zinc-500">
          {open ? '閉じる' : '開く'}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>
      {open && (
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <TouringMap records={records} />
        </div>
      )}
    </div>
  )
}
