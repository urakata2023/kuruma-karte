'use client'

import { useActionState, useState } from 'react'
import { requestReservation } from '@/app/my/[token]/reservation/actions'

type State = { error?: string } | undefined

/**
 * お客様マイページの「予約する」ボタン (Phase B)
 *
 * クリックでモーダルが開き、希望日時 + 内容を入力 → Server Action 送信。
 * 店主には自動メール通知。
 */
export function ReservationButton({
  token,
  shopName,
  defaultPurpose,
}: {
  token: string
  shopName: string
  defaultPurpose?: string
}) {
  const [open, setOpen] = useState(false)
  const action = requestReservation.bind(null, token)
  const [state, formAction, pending] = useActionState<State, FormData>(
    action,
    undefined
  )

  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-md px-4 py-3 text-center text-sm font-semibold"
        style={{
          background: 'var(--theme-primary)',
          color: 'var(--theme-primary-fg)',
        }}
      >
        🗓️ {shopName} に整備を予約する
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            className="w-full max-w-md space-y-4 rounded-2xl p-6 shadow-2xl"
            style={{
              background: 'var(--theme-surface, white)',
              color: 'var(--foreground)',
              borderColor: 'var(--theme-surface-border)',
              borderWidth: 1,
              borderStyle: 'solid',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">🗓️ 整備のご予約</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm opacity-60 hover:opacity-100"
              >
                ✕ 閉じる
              </button>
            </div>

            <p className="text-xs opacity-70">
              希望日と内容を入力すると、{shopName}にリクエストが届きます。
              日程はお店から改めてご連絡します。
            </p>

            <form action={formAction} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium">ご希望日 *</label>
                <input
                  type="date"
                  name="desired_date"
                  required
                  min={tomorrow}
                  defaultValue={tomorrow}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium">時間帯のご希望</label>
                <select
                  name="desired_slot"
                  defaultValue="any"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="any">お任せ</option>
                  <option value="morning">午前</option>
                  <option value="afternoon">午後</option>
                  <option value="evening">夕方</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium">
                  ご相談内容 *
                </label>
                <input
                  type="text"
                  name="purpose"
                  required
                  defaultValue={defaultPurpose ?? ''}
                  placeholder="例: 車検整備、オイル交換、不具合の相談"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium">
                  備考 (任意)
                </label>
                <textarea
                  name="customer_note"
                  rows={3}
                  placeholder="気になっていること、症状の詳細など"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              {state?.error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-md px-4 py-3 text-sm font-semibold disabled:opacity-50"
                style={{
                  background: 'var(--theme-primary)',
                  color: 'var(--theme-primary-fg)',
                }}
              >
                {pending ? '送信中…' : 'この内容で予約する'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
