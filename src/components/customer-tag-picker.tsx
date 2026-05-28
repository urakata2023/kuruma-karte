'use client'

import { useState, useTransition } from 'react'
import { CUSTOMER_TAGS, TAG_COLOR_CLASSES } from '@/lib/customer-tags'
import { updateCustomerTags } from '@/app/(app)/customers/actions'

/**
 * 顧客タグの編集ピッカー (Phase L - C)
 * トグル式で複数選択可能
 */
export function CustomerTagPicker({
  customerId,
  initialTags,
}: {
  customerId: string
  initialTags: string[]
}) {
  const [selected, setSelected] = useState<string[]>(initialTags ?? [])
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function save() {
    startTransition(async () => {
      await updateCustomerTags(customerId, selected)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const dirty =
    selected.length !== initialTags.length ||
    selected.some((id) => !initialTags.includes(id))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CUSTOMER_TAGS.map((tag) => {
          const active = selected.includes(tag.id)
          const cls = TAG_COLOR_CLASSES[tag.color]
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                active
                  ? `${cls.bg} ${cls.fg} border-transparent ring-2 ${cls.ring}`
                  : 'border-zinc-300 bg-transparent text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400'
              }`}
              title={tag.description}
            >
              <span>{tag.icon}</span>
              <span>{tag.label}</span>
            </button>
          )
        })}
      </div>

      {dirty && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {pending ? '保存中…' : 'タグを保存'}
          </button>
          <button
            type="button"
            onClick={() => setSelected(initialTags)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            元に戻す
          </button>
        </div>
      )}

      {saved && (
        <p className="text-xs text-green-600 dark:text-green-400">
          ✓ 保存しました
        </p>
      )}
    </div>
  )
}
