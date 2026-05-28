'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  confirmReservation,
  rejectReservation,
  completeReservation,
} from './actions'
import type { Reservation } from '@/lib/types'

type Props = {
  reservation: Reservation & {
    customer_name: string
    vehicle_model: string | null
    vehicle_plate: string | null
  }
}

export function ReservationCard({ reservation: r }: Props) {
  const [mode, setMode] = useState<'idle' | 'confirm' | 'reject'>('idle')

  const slotJp = (s: string | null) =>
    s === 'morning'
      ? '午前'
      : s === 'afternoon'
        ? '午後'
        : s === 'evening'
          ? '夕方'
          : 'お任せ'

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
          <p className="mt-1 font-medium">
            {r.desired_date} ({slotJp(r.desired_slot)})
          </p>
          <p className="mt-1">{r.purpose}</p>
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
              {r.confirmed_date ?? r.desired_date} (
              {slotJp(r.confirmed_slot ?? r.desired_slot)})
            </p>
            {r.shop_note && (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                {r.shop_note}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 操作ボタン */}
      {r.status === 'requested' && mode === 'idle' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('confirm')}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
          >
            ✓ 承認する
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
          <p className="text-xs font-semibold">承認内容（希望日と違ってもOK）</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              name="confirmed_date"
              type="date"
              defaultValue={r.desired_date}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
            />
            <select
              name="confirmed_slot"
              defaultValue={r.desired_slot ?? 'any'}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="morning">午前</option>
              <option value="afternoon">午後</option>
              <option value="evening">夕方</option>
              <option value="any">お任せ</option>
            </select>
          </div>
          <textarea
            name="shop_note"
            rows={2}
            placeholder="お客様への返答メモ (任意)"
            className="block w-full rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              この内容で承認
            </button>
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
          <p className="text-xs font-semibold">お断り理由 (任意)</p>
          <textarea
            name="shop_note"
            rows={2}
            placeholder="ご希望日は満員のため別日でご相談、など"
            className="block w-full rounded-md border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              お断りする
            </button>
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
            <button
              type="submit"
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
            >
              ✓ 入庫済みにする
            </button>
          </form>
        </div>
      )}
    </li>
  )
}

function StatusPill({ status }: { status: Reservation['status'] }) {
  const styles: Record<Reservation['status'], { bg: string; label: string }> = {
    requested: {
      bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      label: '🔔 承認待ち',
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
