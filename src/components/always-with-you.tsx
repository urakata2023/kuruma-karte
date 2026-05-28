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
        className="relative overflow-hidden rounded-2xl border p-10 text-center shadow-2xl"
        style={{
          // 深い黒ベース × テーマ色のラジアルグラデで「夜のショールーム」感
          background: `
            radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--theme-primary) 50%, transparent) 0%, transparent 50%),
            radial-gradient(circle at 80% 100%, color-mix(in srgb, var(--theme-accent) 30%, transparent) 0%, transparent 50%),
            linear-gradient(180deg, #0a0a0a 0%, #050505 100%)
          `,
          color: '#ffffff',
          borderColor:
            'color-mix(in srgb, var(--theme-accent) 25%, transparent)',
        }}
      >
        {/* 微細なグレインノイズ風: 細い罫線で奥行き */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.015) 3px, rgba(255,255,255,0.015) 4px)',
          }}
          aria-hidden
        />

        {/* 装飾: 左上に細い縦バー */}
        <div
          className="absolute left-6 top-6 h-12 w-px"
          style={{
            background:
              'linear-gradient(180deg, var(--theme-accent), transparent)',
          }}
          aria-hidden
        />
        {/* 装飾: 右下に細い縦バー */}
        <div
          className="absolute bottom-6 right-6 h-12 w-px"
          style={{
            background:
              'linear-gradient(0deg, var(--theme-accent), transparent)',
          }}
          aria-hidden
        />

        <div className="relative">
          <p
            className="text-[10px] uppercase tracking-[0.55em]"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              color:
                'color-mix(in srgb, var(--theme-accent) 80%, white)',
            }}
          >
            Always with you
          </p>

          <p
            className="mt-7 text-3xl sm:text-4xl"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--theme-accent)',
              textShadow:
                '0 0 30px color-mix(in srgb, var(--theme-accent) 40%, transparent)',
            }}
          >
            {now ? <Counter from={from} to={now} /> : <Placeholder />}
          </p>

          {/* スクリプトフォント (Caveat) でサイン風 */}
          <p
            className="mt-7"
            style={{
              fontFamily: 'var(--font-script), cursive',
              fontSize: '1.5rem',
              lineHeight: 1,
              color:
                'color-mix(in srgb, var(--theme-accent) 60%, white)',
              fontStyle: 'italic',
            }}
          >
            Keep on rolling.
          </p>
        </div>
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
        color: 'color-mix(in srgb, var(--theme-accent) 45%, transparent)',
        fontSize: '0.65em',
        marginLeft: '0.05em',
        marginRight: '0.15em',
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
