'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  confirmReservation,
  proposeAlternativeDates,
  rejectReservation,
  completeReservation,
} from './actions'
import type { Reservation, DateCandidate } from '@/lib/types'
import { RESERVATION_SLOTS, slotLabel } from '@/lib/reservation-slots'
import { SubmitButton } from '@/components/submit-button'

type Props = {
  reservation: Reservation & {
    customer_name: string
    vehicle_model: string | null
    vehicle_plate: string | null
  }
}

const slotJp = slotLabel

export function ReservationCard({ reservation: r }: Props) {
  const [mode, setMode] = useState<
    'idle' | 'confirm' | 'propose' | 'reject'
  >('idle')

  // candidate_dates は JSON で来る (Phase G)、互換のため旧フィールドにフォールバック
  const candidates: DateCandidate[] =
    Array.isArray(r.candidate_dates) && r.candidate_dates.length > 0
      ? r.candidate_dates
      : [{ date: r.desired_date, slot: (r.desired_slot ?? 'any') as DateCandidate['slot'] }]

  const isPending = r.status === 'requested' || r.status === 'pending_shop'

  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-black">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/customers/${r.customer_id}`}
              className="text-base font-semibold hover:underline"
            >
              {r.customer_name} 様
            </Link>
            <StatusPill status={r.status} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {r.vehicle_model ?? '車両'}
            {r.vehicle_plate && ` · ${r.vehicle_plate}`}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 rounded-md bg-zinc-50 p-3 text-xs dark:bg-zinc-900 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            お客様のご希望
          </p>
          <ul className="mt-1 space-y-0.5">
            {candidates.map((c, i) => (
              <li key={i}>
                <span className="font-medium">
                  {['第1', '第2', '第3'][i] ?? `第${i + 1}`}希望：
                </span>
                {c.date} ({slotJp(c.slot)})
              </li>
            ))}
          </ul>
          <p className="mt-2">{r.purpose}</p>
          {r.customer_note && (
            <p className="mt-2 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
              {r.customer_note}
            </p>
          )}
        </div>

        {(r.status === 'confirmed' || r.status === 'completed') && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              確定内容
            </p>
            <p className="mt-1 font-medium">
              {r.confirmed_date} ({slotJp(r.confirmed_slot)})
            </p>
            {r.shop_note && (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {r.shop_note}
              </p>
            )}
          </div>
        )}

        {r.status === 'pending_customer' &&
          r.shop_candidate_dates &&
          r.shop_candidate_dates.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                再提案中 (お客様の返答待ち)
              </p>
              <ul className="mt-1 space-y-0.5">
                {r.shop_candidate_dates.map((c, i) => (
                  <li key={i}>
                    候補{i + 1}：{c.date} ({slotJp(c.slot)})
                  </li>
                ))}
              </ul>
              {r.shop_note && (
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  {r.shop_note}
                </p>
              )}
            </div>
          )}
      </div>

      {/* 操作ボタン */}
      {isPending && mode === 'idle' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('confirm')}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
          >
            ✓ いずれかの日で承認
          </button>
          <button
            type="button"
            onClick={() => setMode('propose')}
            className="rounded-md border border-blue-500 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
          >
            📅 全部NG → 3日程を再提案
          </button>
          <button
            type="button"
            onClick={() => setMode('reject')}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700"
          >
            お断りする
          </button>
        </div>
      )}

      {mode === 'confirm' && (
        <form
          action={confirmReservation.bind(null, r.id)}
          className="mt-3 space-y-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950"
        >
          <p className="text-xs font-semibold">承認する候補を選んでください</p>
          <div className="grid grid-cols-2 gap-2">
            <select
              name="confirmed_date"
              defaultValue={candidates[0]?.date}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
            >
              {candidates.map((c, i) => (
                <option key={i} value={c.date}>
                  {['第1', '第2', '第3'][i] ?? `第${i + 1}`}希望: {c.date}
                </option>
              ))}
            </select>
            <select
              name="confirmed_slot"
              defaultValue={candidates[0]?.slot ?? 'any'}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
            >
              {RESERVATION_SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            name="shop_note"
            rows={2}
            placeholder="お客様へのメッセージ (任意)"
            className="block w-full rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="flex gap-2">
            <SubmitButton
              pendingLabel="送信中…"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              この内容で承認 (お客様にメール)
            </SubmitButton>
            <button
              type="button"
              onClick={() => setMode('idle')}
              className="text-xs opacity-60 hover:opacity-100"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {mode === 'propose' && (
        <form
          action={proposeAlternativeDates.bind(null, r.id)}
          className="mt-3 space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950"
        >
          <p className="text-xs font-semibold">
            📅 代替候補を3日程ご提案ください
          </p>
          <AltDateRow label="候補1" namePrefix="alt1" />
          <AltDateRow label="候補2" namePrefix="alt2" />
          <AltDateRow label="候補3" namePrefix="alt3" />
          <textarea
            name="shop_note"
            rows={2}
            placeholder="お客様へのメッセージ (例: ご希望日は満員のため別日でいかがでしょうか)"
            className="block w-full rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="flex gap-2">
            <SubmitButton
              pendingLabel="送信中…"
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              この3日程で再提案 (お客様にメール)
            </SubmitButton>
            <button
              type="button"
              onClick={() => setMode('idle')}
              className="text-xs opacity-60 hover:opacity-100"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {mode === 'reject' && (
        <form
          action={rejectReservation.bind(null, r.id)}
          className="mt-3 space-y-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950"
        >
          <p className="text-xs font-semibold">お断り理由・メッセージ (任意)</p>
          <textarea
            name="shop_note"
            rows={2}
            placeholder="お客様へお伝えしたい内容"
            className="block w-full rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="flex gap-2">
            <SubmitButton
              pendingLabel="送信中…"
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              お断りする (お客様にメール)
            </SubmitButton>
            <button
              type="button"
              onClick={() => setMode('idle')}
              className="text-xs opacity-60 hover:opacity-100"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {r.status === 'confirmed' && (
        <div className="mt-3">
          <form action={completeReservation.bind(null, r.id)}>
            <SubmitButton
              pendingLabel="処理中…"
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              ✓ 入庫済みにする
            </SubmitButton>
          </form>
        </div>
      )}
    </li>
  )
}

function AltDateRow({
  label,
  namePrefix,
}: {
  label: string
  namePrefix: string
}) {
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="grid grid-cols-4 items-center gap-2">
      <span className="text-xs font-medium">{label}</span>
      <input
        type="date"
        name={`${namePrefix}_date`}
        min={today}
        className="col-span-2 rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
      />
      <select
        name={`${namePrefix}_slot`}
        defaultValue="any"
        className="rounded-md border border-zinc-300 px-1 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
      >
        {RESERVATION_SLOTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function StatusPill({ status }: { status: Reservation['status'] }) {
  const styles: Record<Reservation['status'], { bg: string; label: string }> = {
    requested: {
      bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      label: '🔔 承認待ち',
    },
    pending_shop: {
      bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      label: '🔔 承認待ち',
    },
    pending_customer: {
      bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      label: '📨 お客様返答待ち',
    },
    confirmed: {
      bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      label: '✅ 確定',
    },
    rejected: {
      bg: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      label: 'お断り',
    },
    completed: {
      bg: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      label: '完了',
    },
    cancelled: {
      bg: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      label: 'キャンセル',
    },
  }
  const s = styles[status]
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.bg}`}>
      {s.label}
    </span>
  )
}
