'use client'

import { useActionState, useState } from 'react'
import { requestReservation } from '@/app/my/[token]/reservation/actions'
import { RESERVATION_SLOTS } from '@/lib/reservation-slots'
import { SubmitButton } from '@/components/submit-button'

type State = { error?: string } | undefined

/**
 * お客様マイページの「予約する」ボタン (Phase G)
 *
 * 3日程キャッチボール式：
 * - お客様が 第1〜第3希望日 を提示
 * - 店主は承認 or 3日程再提案
 * - お客様は再提案を確認して選択
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
  const [state, formAction] = useActionState<State, FormData>(
    action,
    undefined
  )

  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10)
  const dayAfter = new Date(Date.now() + 2 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10)
  const day3 = new Date(Date.now() + 3 * 24 * 3600 * 1000)
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
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl p-6 shadow-2xl"
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
              ご希望日を <b>3つ</b>{' '}
              お選びください。{shopName}が空き状況を確認のうえ、
              いずれかで確定するか、別日の代替候補をご提案します。
            </p>

            <form action={formAction} className="space-y-3">
              <CandidateField
                label="第1希望"
                nameDate="candidate1_date"
                nameSlot="candidate1_slot"
                defaultDate={tomorrow}
                required
              />
              <CandidateField
                label="第2希望"
                nameDate="candidate2_date"
                nameSlot="candidate2_slot"
                defaultDate={dayAfter}
              />
              <CandidateField
                label="第3希望"
                nameDate="candidate3_date"
                nameSlot="candidate3_slot"
                defaultDate={day3}
              />

              <div className="space-y-1 pt-2">
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

              <SubmitButton
                pendingLabel="送信中…"
                className="w-full rounded-md px-4 py-3 text-sm font-semibold disabled:opacity-50"
                style={{
                  background: 'var(--theme-primary)',
                  color: 'var(--theme-primary-fg)',
                }}
              >
                この内容で予約をお願いする
              </SubmitButton>

              <p className="text-center text-[10px] opacity-50">
                ご返答はメールでお届けします
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function CandidateField({
  label,
  nameDate,
  nameSlot,
  defaultDate,
  required = false,
}: {
  label: string
  nameDate: string
  nameSlot: string
  defaultDate: string
  required?: boolean
}) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div>
      <label className="block text-xs font-medium">
        {label}
        {required && ' *'}
      </label>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <input
          type="date"
          name={nameDate}
          min={today}
          defaultValue={defaultDate}
          required={required}
          className="col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
        <select
          name={nameSlot}
          defaultValue="any"
          className="rounded-md border border-zinc-300 px-2 py-2 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        >
          {RESERVATION_SLOTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
