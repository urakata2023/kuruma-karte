'use client'

import { useEffect, useState } from 'react'

/**
 * 「ALWAYS WITH YOU」— 愛車との時間をリアルタイムで刻むカウンター
 *
 * 例: 02y 05m 12d 08h 15m 32s
 * すべて ITC Avant Garde Gothic Bold (var(--font-display)) で統一。
 * 各数字を固定幅spanで囲み、tabular非対応フォントでも桁ずれしないように。
 */
export function AlwaysWithYou({ startIso }: { startIso: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const from = new Date(startIso)

  return (
    <section className="mx-auto w-full max-w-2xl px-6 pt-6">
      <div
        className="relative overflow-hidden rounded-2xl border p-8 text-center shadow-xl"
        style={{
          // テーマ駆動: primary背景 + accent影響のグラデーション
          background:
            'linear-gradient(135deg, var(--theme-primary) 0%, color-mix(in srgb, var(--theme-primary) 80%, black) 100%)',
          color: 'var(--theme-primary-fg)',
          borderColor:
            'color-mix(in srgb, var(--theme-primary-fg) 20%, transparent)',
        }}
      >
        {/* デコ：上下のドットライン */}
        <div
          className="absolute inset-x-6 top-3 flex justify-between text-[6px]"
          style={{
            color:
              'color-mix(in srgb, var(--theme-primary-fg) 30%, transparent)',
          }}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i}>●</span>
          ))}
        </div>
        <div
          className="absolute inset-x-6 bottom-3 flex justify-between text-[6px]"
          style={{
            color:
              'color-mix(in srgb, var(--theme-primary-fg) 30%, transparent)',
          }}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i}>●</span>
          ))}
        </div>

        <p
          className="text-xs uppercase tracking-[0.5em]"
          style={{
            fontFamily: 'var(--font-display), sans-serif',
            color:
              'color-mix(in srgb, var(--theme-primary-fg) 70%, transparent)',
          }}
        >
          Always with you
        </p>

        <p
          className="mt-5 text-2xl sm:text-3xl"
          style={{
            fontFamily: 'var(--font-display), sans-serif',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--theme-accent)',
          }}
        >
          {now ? <Counter from={from} to={now} /> : <Placeholder />}
        </p>

        <p
          className="mt-5 text-[11px] uppercase tracking-[0.3em]"
          style={{
            fontFamily: 'var(--font-display), sans-serif',
            color:
              'color-mix(in srgb, var(--theme-primary-fg) 60%, transparent)',
          }}
        >
          Keep on rolling.
        </p>
      </div>
    </section>
  )
}

/** 数字をすべて固定幅spanで包んで、フォントの数字幅差を吸収 */
function Counter({ from, to }: { from: Date; to: Date }) {
  const d = diffYMDHMS(from, to)
  return (
    <span>
      <Pad2 n={d.years} />
      <Unit>y</Unit> <Pad2 n={d.months} />
      <Unit>m</Unit> <Pad2 n={d.days} />
      <Unit>d</Unit> <Pad2 n={d.hours} />
      <Unit>h</Unit> <Pad2 n={d.minutes} />
      <Unit>m</Unit> <Pad2 n={d.seconds} />
      <Unit>s</Unit>
    </span>
  )
}

function Pad2({ n }: { n: number }) {
  const s = String(Math.max(0, n)).padStart(2, '0')
  return (
    <>
      <span className="inline-block w-[0.62em] text-center">{s[0]}</span>
      <span className="inline-block w-[0.62em] text-center">{s[1]}</span>
    </>
  )
}

function Unit({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        color: 'color-mix(in srgb, var(--theme-accent) 60%, transparent)',
      }}
    >
      {children}
    </span>
  )
}

function Placeholder() {
  return (
    <span className="opacity-40">--y --m --d --h --m --s</span>
  )
}

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

  if (to.getTime() < from.getTime()) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return { years, months, days, hours, minutes, seconds }
}
