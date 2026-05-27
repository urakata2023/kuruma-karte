'use client'

import { useEffect, useState } from 'react'

/**
 * 「ALWAYS WITH YOU」— 愛車との時間をリアルタイムで刻むカウンター
 *
 * 例: 02y 05m 12d 08h 15m 32s
 * 起点：購入日（なければ初度登録年月の月初）
 */
export function AlwaysWithYou({ startIso }: { startIso: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    // SSRとクライアントの不整合を避けるため、マウント後にセット
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const from = new Date(startIso)

  return (
    <section className="mx-auto w-full max-w-2xl px-6 pt-6">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 text-center text-zinc-100 shadow-xl">
        {/* デコ：上下のドットライン */}
        <div className="absolute inset-x-6 top-3 flex justify-between text-[6px] text-zinc-700">
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i}>●</span>
          ))}
        </div>
        <div className="absolute inset-x-6 bottom-3 flex justify-between text-[6px] text-zinc-700">
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i}>●</span>
          ))}
        </div>

        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">
          Always with you
        </p>

        <p className="mt-5 font-mono text-2xl tracking-tight tabular-nums sm:text-3xl">
          {now ? <Counter from={from} to={now} /> : <Placeholder />}
        </p>

        <p className="mt-5 text-xs italic tracking-wide text-zinc-500">
          Keep on rolling.
        </p>
      </div>
    </section>
  )
}

function Counter({ from, to }: { from: Date; to: Date }) {
  const d = diffYMDHMS(from, to)
  return (
    <>
      {pad2(d.years)}y {pad2(d.months)}m {pad2(d.days)}d {pad2(d.hours)}h{' '}
      {pad2(d.minutes)}m {pad2(d.seconds)}s
    </>
  )
}

function Placeholder() {
  // SSR時のフォールバック（マウント前）
  return <span className="opacity-40">--y --m --d --h --m --s</span>
}

function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, '0')
}

/**
 * 2つの日時の差を 年/月/日/時/分/秒 に分解する。
 * うるう年・月の日数を考慮した「カレンダー差」。
 */
function diffYMDHMS(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear()
  let months = to.getMonth() - from.getMonth()
  let days = to.getDate() - from.getDate()
  let hours = to.getHours() - from.getHours()
  let minutes = to.getMinutes() - from.getMinutes()
  let seconds = to.getSeconds() - from.getSeconds()

  if (seconds < 0) {
    minutes -= 1
    seconds += 60
  }
  if (minutes < 0) {
    hours -= 1
    minutes += 60
  }
  if (hours < 0) {
    days -= 1
    hours += 24
  }
  if (days < 0) {
    // 前月の日数で繰り下げ
    const prevMonthLastDay = new Date(
      to.getFullYear(),
      to.getMonth(),
      0
    ).getDate()
    months -= 1
    days += prevMonthLastDay
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  // from が未来日付の場合は全部0
  if (to.getTime() < from.getTime()) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return { years, months, days, hours, minutes, seconds }
}
