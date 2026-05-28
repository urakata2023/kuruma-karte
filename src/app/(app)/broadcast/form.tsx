'use client'

import { useActionState, useState } from 'react'
import { sendBroadcastEmail } from './actions'
import { SubmitButton } from '@/components/submit-button'
import type { CustomerTagDef } from '@/lib/customer-tags'

type State =
  | { error?: string; ok?: true; sentCount?: number; skipped?: number }
  | undefined

export function BroadcastForm({
  totalCount,
  tagCounts,
  tags,
}: {
  totalCount: number
  tagCounts: Record<string, number>
  tags: CustomerTagDef[]
}) {
  const [state, action, pending] = useActionState<State, FormData>(
    sendBroadcastEmail as unknown as (
      prev: State,
      formData: FormData
    ) => Promise<State>,
    undefined
  )
  const [filter, setFilter] = useState<string>('all')
  const [confirm, setConfirm] = useState(false)

  const filterCount = filter === 'all' ? totalCount : tagCounts[filter] ?? 0

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="tag_filter" value={filter} />

      <div
        className="rounded-xl border p-5"
        style={{
          background: 'var(--surface-1)',
          borderColor: 'var(--hairline)',
        }}
      >
        <p
          className="text-eyebrow"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          Step 1
        </p>
        <h2
          className="mt-1 text-title"
          style={{ color: 'var(--ink)' }}
        >
          配信対象を選ぶ
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label={`すべて (${totalCount}名)`}
          />
          {tags.map((tag) => {
            const c = tagCounts[tag.id] ?? 0
            if (c === 0) return null
            return (
              <FilterChip
                key={tag.id}
                active={filter === tag.id}
                onClick={() => setFilter(tag.id)}
                label={`${tag.icon} ${tag.label} (${c})`}
              />
            )
          })}
        </div>

        <p
          className="mt-3 text-xs"
          style={{ color: 'var(--ink-subtle)' }}
        >
          選択中: <b>{filterCount}名</b> に配信予定
        </p>
      </div>

      <div
        className="rounded-xl border p-5"
        style={{
          background: 'var(--surface-1)',
          borderColor: 'var(--hairline)',
        }}
      >
        <p
          className="text-eyebrow"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          Step 2
        </p>
        <h2
          className="mt-1 text-title"
          style={{ color: 'var(--ink)' }}
        >
          件名・本文
        </h2>

        <div className="mt-4 space-y-3">
          <div>
            <label
              className="block text-xs font-medium"
              style={{ color: 'var(--ink-muted)' }}
            >
              件名 *
            </label>
            <input
              type="text"
              name="subject"
              required
              placeholder="例: 春のオイル交換キャンペーンのご案内"
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-medium"
              style={{ color: 'var(--ink-muted)' }}
            >
              本文 *
            </label>
            <textarea
              name="body"
              required
              rows={8}
              placeholder="お客様各位&#10;&#10;いつもお世話になっております。"
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
            />
            <p
              className="mt-1 text-xs"
              style={{ color: 'var(--ink-tertiary)' }}
            >
              本文の上に「{`{customerName}様`}」が自動で挿入されます
            </p>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      {state?.ok && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          ✓ 配信完了: 成功 {state.sentCount} 件 / 失敗・スキップ{' '}
          {state.skipped} 件
        </p>
      )}

      {/* 確認チェック */}
      <label
        className="flex items-start gap-3 rounded-md border p-3 text-sm"
        style={{
          background: 'var(--surface-2)',
          borderColor: 'var(--hairline)',
        }}
      >
        <input
          type="checkbox"
          checked={confirm}
          onChange={(e) => setConfirm(e.target.checked)}
          className="mt-1"
        />
        <span>
          <b>{filterCount}名</b>{' '}
          にメールを送信することを確認しました。送信後は取り消せません。
        </span>
      </label>

      <SubmitButton
        pending={pending}
        pendingLabel="配信中…"
        className="w-full rounded-md px-4 py-3 text-sm font-semibold disabled:opacity-50"
        style={{
          background: confirm ? 'var(--theme-primary)' : 'var(--surface-3)',
          color: confirm ? 'var(--theme-primary-fg)' : 'var(--ink-tertiary)',
          cursor: confirm ? 'pointer' : 'not-allowed',
        }}
        type="submit"
      >
        📣 この内容で {filterCount}名 に配信する
      </SubmitButton>

      {!confirm && (
        <p
          className="text-center text-xs"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          ↑ チェックボックスにチェックすると配信できます
        </p>
      )}
    </form>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
      style={{
        background: active ? 'var(--theme-primary)' : 'transparent',
        color: active ? 'var(--theme-primary-fg)' : 'var(--ink-muted)',
        borderColor: active ? 'var(--theme-primary)' : 'var(--hairline)',
      }}
    >
      {label}
    </button>
  )
}
