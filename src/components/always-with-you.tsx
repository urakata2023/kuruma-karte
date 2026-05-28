'use client'

import { useEffect, useState } from 'react'

/**
 * 「ALWAYS WITH YOU」— 愛車との時間をフリップクロック風に刻むカウンター
 *
 * リファレンス: パタパタ時計 (Flip Clock)
 * - 各単位を黒いカード型セルに分割
 * - 中央に hairline (パタパタの切れ目)
 * - 上端に小さな単位ラベル
 * - 全体は時計筐体風のマットブラックフレーム
 */
export function AlwaysWithYou({ startIso }: { startIso: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const from = new Date(startIso)
  const d = now
    ? diffYMDHMS(from, now)
    : { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }

  const cells: { label: string; value: number }[] = [
    { label: 'YEARS', value: d.years },
    { label: 'MONTHS', value: d.months },
    { label: 'DAYS', value: d.days },
    { label: 'HOURS', value: d.hours },
    { label: 'MINS', value: d.minutes },
    { label: 'SECS', value: d.seconds },
  ]

  return (
    <section className="mx-auto w-full max-w-2xl px-6 pt-6">
      <div
        className="relative overflow-hidden rounded-3xl border p-8 shadow-2xl sm:p-10"
        style={{
          // マットブラック筐体: 上から下にかすかなグラデで奥行き
          background:
            'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 50%, #050505 100%)',
          borderColor: '#2a2a2a',
        }}
      >
        {/* ハイライト (筐体の上端に光) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
          }}
          aria-hidden
        />

        {/* 上部ラベル */}
        <p
          className="text-center text-[10px] uppercase tracking-[0.55em]"
          style={{
            fontFamily: 'var(--font-display), sans-serif',
            color: 'color-mix(in srgb, var(--theme-accent) 75%, white)',
          }}
        >
          Always with you
        </p>

        {/* フリップクロックセル */}
        <div className="mt-6 grid grid-cols-6 gap-1.5 sm:gap-2">
          {cells.map((c) => (
            <FlipCell key={c.label} label={c.label} value={c.value} />
          ))}
        </div>

        {/* スクリプトサイン (大きく) */}
        <p
          className="mt-8 text-center"
          style={{
            fontFamily: 'var(--font-script), cursive',
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            lineHeight: 1,
            color:
              'color-mix(in srgb, var(--theme-accent) 70%, white)',
            fontStyle: 'italic',
            textShadow:
              '0 0 24px color-mix(in srgb, var(--theme-accent) 30%, transparent)',
          }}
        >
          Keep on rolling.
        </p>
      </div>
    </section>
  )
}

/**
 * フリップクロックの 1セル
 * 黒いカード + 上にラベル + 中央 hairline + 大きな数字
 */
function FlipCell({ label, value }: { label: string; value: number }) {
  const padded = String(Math.max(0, value)).padStart(2, '0')
  return (
    <div
      className="relative aspect-[3/4] overflow-hidden rounded-md"
      style={{
        background:
          'linear-gradient(180deg, #1e1e1e 0%, #0d0d0d 50%, #0d0d0d 50%, #161616 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      {/* ラベル (上端) */}
      <p
        className="absolute left-2 top-1.5 text-[8px] font-medium tracking-[0.15em] sm:text-[9px]"
        style={{
          fontFamily: 'var(--font-display), sans-serif',
          color: 'rgba(255,255,255,0.35)',
        }}
      >
        {label}
      </p>

      {/* 数字 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontVariantNumeric: 'tabular-nums',
          color: 'rgba(255,255,255,0.95)',
        }}
      >
        <span
          className="text-3xl font-bold sm:text-5xl"
          style={{ letterSpacing: '-0.02em' }}
        >
          {padded}
        </span>
      </div>

      {/* 中央の hairline (パタパタの切れ目) */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.85) 80%, transparent)',
        }}
        aria-hidden
      />

      {/* 上半分と下半分のかすかな境界ハイライト */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-[1px]"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
        }}
        aria-hidden
      />
    </div>
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
