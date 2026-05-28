'use client'

import { useState, useTransition } from 'react'
import { acceptShopProposal } from '@/app/my/[token]/reservation/actions'
import type { Reservation, DateCandidate } from '@/lib/types'

/**
 * お客様マイページの「店主からの再提案カード」 (Phase G)
 *
 * 店主が proposeAlternativeDates() で3日程の代替を提示した場合、
 * このカードが出てラジオで選択 → 確定ボタン。
 */
export function ReservationProposalCard({
  token,
  reservation,
}: {
  token: string
  reservation: Reservation
}) {
  const candidates = reservation.shop_candidate_dates ?? []
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [pending, startTransition] = useTransition()

  if (candidates.length === 0) return null

  const slotJp = (s: string) =>
    s === 'morning'
      ? '午前'
      : s === 'afternoon'
        ? '午後'
        : s === 'evening'
          ? '夕方'
          : 'お任せ'

  function handleAccept() {
    const c = candidates[selectedIdx]
    if (!c) return
    const fd = new FormData()
    fd.set('accepted_date', c.date)
    fd.set('accepted_slot', c.slot)
    startTransition(() => {
      acceptShopProposal(token, reservation.id, fd)
    })
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-6 pt-2">
      <div
        className="overflow-hidden rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-sm dark:border-amber-700 dark:bg-amber-950"
        style={{ color: 'var(--foreground)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          📨 お店からのお返事
        </p>
        <h3 className="mt-1 text-base font-semibold">
          別日のご提案をいただいています
        </h3>

        {reservation.shop_note && (
          <p className="mt-2 whitespace-pre-wrap rounded-md bg-white/60 px-3 py-2 text-xs dark:bg-black/30">
            {reservation.shop_note}
          </p>
        )}

        <p className="mt-3 text-xs">どの候補で進めますか？</p>
        <div className="mt-2 space-y-2">
          {(candidates as DateCandidate[]).map((c, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-3 rounded-md border-2 p-3 ${
                selectedIdx === i
                  ? 'border-amber-600 bg-white dark:bg-zinc-900'
                  : 'border-transparent bg-white/40 dark:bg-zinc-900/40'
              }`}
            >
              <input
                type="radio"
                name="alt-choice"
                checked={selectedIdx === i}
                onChange={() => setSelectedIdx(i)}
                className="h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold">
                  候補{i + 1}：{c.date}
                </p>
                <p className="text-xs opacity-70">{slotJp(c.slot)}</p>
              </div>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAccept}
          disabled={pending}
          className="mt-4 w-full rounded-md bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? '送信中…' : 'この候補で予約を確定する'}
        </button>

        <p className="mt-2 text-center text-[10px] opacity-60">
          どの候補も難しい場合は、お電話でお店までご相談ください
        </p>
      </div>
    </section>
  )
}
