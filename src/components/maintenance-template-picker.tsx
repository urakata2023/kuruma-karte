'use client'

import { useState } from 'react'
import {
  MAINTENANCE_TEMPLATES,
  type MaintenanceTemplate,
} from '@/lib/maintenance-templates'

/**
 * 整備テンプレート選択UI (Phase 12-3)
 *
 * クリックするとフォームの input[name=title/description/parts/cost]
 * にデフォルト値を流し込む。
 * uncontrolled input を直接書き換えるDOM操作スタイル
 * (既存フォームと整合性を保つため)。
 */
export function MaintenanceTemplatePicker() {
  const [open, setOpen] = useState(true)
  const [appliedId, setAppliedId] = useState<string | null>(null)

  function apply(t: MaintenanceTemplate) {
    const setVal = (name: string, value: string) => {
      const el = document.getElementsByName(name)[0] as
        | HTMLInputElement
        | HTMLTextAreaElement
        | undefined
      if (el) {
        el.value = value
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
    setVal('title', t.title)
    setVal('description', t.description)
    setVal('parts', t.parts)
    setVal('cost', t.cost?.toString() ?? '')
    setAppliedId(t.id)
  }

  const popular = MAINTENANCE_TEMPLATES.filter((t) => t.popular)
  const others = MAINTENANCE_TEMPLATES.filter((t) => !t.popular)

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-200">
          ⚡ 整備テンプレート（ワンタップで入力）
        </span>
        <span className="text-xs text-blue-700 dark:text-blue-300">
          {open ? '▲ 閉じる' : '▼ 開く'}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* よく使うもの */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              よく使う
            </p>
            <div className="flex flex-wrap gap-1.5">
              {popular.map((t) => (
                <TemplateButton
                  key={t.id}
                  t={t}
                  active={appliedId === t.id}
                  onClick={() => apply(t)}
                />
              ))}
            </div>
          </div>

          {/* その他 */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              その他
            </p>
            <div className="flex flex-wrap gap-1.5">
              {others.map((t) => (
                <TemplateButton
                  key={t.id}
                  t={t}
                  active={appliedId === t.id}
                  onClick={() => apply(t)}
                />
              ))}
            </div>
          </div>

          {appliedId && (
            <p className="rounded-md bg-white px-3 py-2 text-xs text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              ✓ テンプレートを入力欄に反映しました。下の各項目で調整できます。
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function TemplateButton({
  t,
  active,
  onClick,
}: {
  t: MaintenanceTemplate
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-blue-600 bg-blue-600 text-white'
          : 'border-blue-300 bg-white text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900'
      }`}
    >
      <span>{t.icon}</span>
      <span>{t.label}</span>
    </button>
  )
}
