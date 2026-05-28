'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Task = {
  vehicle_id: string
  customer_id: string
  customer_name: string
  customer_phone: string | null
  model: string | null
  plate_number: string | null
  inspection_expires_on: string
  daysToExpiry: number
}

const STORAGE_KEY = 'kuruma-contacted-vehicles-v1'

/**
 * ダッシュボード「今日のタスク」 (Phase 12-2)
 *
 * 「今日電話すべき相手リスト」を一番上に大きく表示。
 * - 車検が今月以内に来る車両を抽出
 * - 連絡済みチェックは localStorage で管理 (まずシンプルに、後でDB化検討)
 * - 残り日数で緊急度を色分け
 */
export function TodayTasks({ tasks }: { tasks: Task[] }) {
  const [contacted, setContacted] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  // localStorage から復元
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const obj = JSON.parse(raw) as Record<string, string>
        // 30日以上前のフラグは捨てる
        const now = Date.now()
        const fresh: [string, string][] = Object.entries(obj).filter(
          ([, ts]) => now - new Date(ts).getTime() < 30 * 24 * 3600 * 1000
        )
        setContacted(new Set(fresh.map(([id]) => id)))
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  function toggle(vehicleId: string) {
    setContacted((prev) => {
      const next = new Set(prev)
      let stored: Record<string, string> = {}
      try {
        stored = JSON.parse(
          window.localStorage.getItem(STORAGE_KEY) ?? '{}'
        ) as Record<string, string>
      } catch {
        stored = {}
      }
      if (next.has(vehicleId)) {
        next.delete(vehicleId)
        delete stored[vehicleId]
      } else {
        next.add(vehicleId)
        stored[vehicleId] = new Date().toISOString()
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
      } catch {
        // ignore
      }
      return next
    })
  }

  if (tasks.length === 0) {
    return (
      <section className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
        <h2 className="text-base font-semibold text-green-900 dark:text-green-200">
          ☀️ 今日の電話タスク
        </h2>
        <p className="mt-2 text-sm text-green-800 dark:text-green-300">
          今のところ、車検期日の近い顧客はいません。落ち着いた1日になりそうです。
        </p>
      </section>
    )
  }

  const remaining = tasks.filter((t) => !contacted.has(t.vehicle_id)).length

  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm dark:border-amber-700 dark:from-amber-950 dark:to-orange-950">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            📞 今日の電話タスク
          </h2>
          <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
            車検まで残り60日以内のお客様です。
            {hydrated && (
              <span className="ml-2 font-semibold">
                残り {remaining} / {tasks.length} 件
              </span>
            )}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {tasks.map((t) => {
          const done = contacted.has(t.vehicle_id)
          const urgency = urgencyOf(t.daysToExpiry)
          return (
            <li
              key={t.vehicle_id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-all ${
                done
                  ? 'border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900'
                  : 'border-white bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900'
              }`}
            >
              <label className="flex flex-1 cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggle(t.vehicle_id)}
                  className="mt-1 h-5 w-5 rounded border-zinc-300"
                />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-semibold ${
                        done ? 'line-through' : ''
                      }`}
                    >
                      {t.customer_name} 様
                    </p>
                    <UrgencyBadge urgency={urgency} days={t.daysToExpiry} />
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {t.model ?? '車種未登録'}
                    {t.plate_number && ` · ${t.plate_number}`}
                    <span className="ml-2 text-zinc-500">
                      車検満了：{formatDate(t.inspection_expires_on)}
                    </span>
                  </p>
                </div>
              </label>

              <div className="flex items-center gap-2 whitespace-nowrap">
                {t.customer_phone && (
                  <a
                    href={`tel:${t.customer_phone}`}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    📞 電話
                  </a>
                )}
                <Link
                  href={`/customers/${t.customer_id}`}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  詳細
                </Link>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 text-[10px] text-amber-800/70 dark:text-amber-300/70">
        ※ ✓は端末ごとに記憶されます (30日で自動リセット)。
      </p>
    </section>
  )
}

function urgencyOf(days: number): 'overdue' | 'high' | 'medium' | 'low' {
  if (days < 0) return 'overdue'
  if (days <= 14) return 'high'
  if (days <= 30) return 'medium'
  return 'low'
}

function UrgencyBadge({
  urgency,
  days,
}: {
  urgency: 'overdue' | 'high' | 'medium' | 'low'
  days: number
}) {
  const styles = {
    overdue: 'bg-red-600 text-white',
    high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    low: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  }
  const label =
    urgency === 'overdue'
      ? `⚠️ ${Math.abs(days)}日経過`
      : `あと ${days}日`
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[urgency]}`}
    >
      {label}
    </span>
  )
}

function formatDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${y}/${m}/${day}`
}
