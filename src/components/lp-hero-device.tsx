'use client'

import { useEffect, useState } from 'react'

/**
 * 公開LP ヒーローの主役 — 「お客様が実際に見るマイページ」をスマホ筐体ごと再現する。
 *
 * 何のサービスか一目で伝えるため、抽象的なイラストではなく
 * 実機能（ALWAYS WITH YOU ライブカウンター・ナンバープレート・整備ステータス）を
 * そのまま縮約して見せる。色は親の data-theme="rosso" から
 * --theme-primary (レーシングレッド) / --theme-accent (ゴールド) を継承する。
 */
export function LpHeroDevice() {
  // 「納車日」を起点にした経過時間を1秒刻みで更新（クライアントのみ）
  const startIso = '2022-09-18T10:30:00+09:00'
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const elapsed = now
    ? diff(new Date(startIso), now)
    : { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }

  const cells = [
    { label: 'Y', value: elapsed.years },
    { label: 'M', value: elapsed.months },
    { label: 'D', value: elapsed.days },
    { label: 'H', value: elapsed.hours },
    { label: 'M', value: elapsed.minutes },
    { label: 'S', value: elapsed.seconds },
  ]

  return (
    <div className="relative mx-auto w-[286px] select-none sm:w-[320px]">
      {/* 背後のレッドグロー */}
      <div
        className="lp-glow pointer-events-none absolute -inset-10 -z-10 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--theme-primary) 55%, transparent), transparent 70%)',
        }}
        aria-hidden
      />

      {/* スマホ筐体 */}
      <div
        className="relative overflow-hidden rounded-[2.6rem] border p-2.5 shadow-2xl"
        style={{
          borderColor: '#2a2a2a',
          background:
            'linear-gradient(160deg, #1c1c1c 0%, #0c0c0c 60%, #060606 100%)',
        }}
      >
        {/* スキャンライン */}
        <div
          className="lp-scan pointer-events-none absolute inset-x-0 top-0 z-20 h-16"
          style={{
            background:
              'linear-gradient(180deg, transparent, color-mix(in srgb, var(--theme-primary) 16%, transparent), transparent)',
          }}
          aria-hidden
        />

        {/* 画面 */}
        <div
          className="relative overflow-hidden rounded-[2.05rem]"
          style={{ background: '#0a0a0a' }}
        >
          {/* ノッチ */}
          <div className="absolute left-1/2 top-2 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

          {/* ステータスバー */}
          <div className="flex items-center justify-between px-5 pb-1 pt-2.5 text-[9px] font-semibold tracking-wider text-white/70">
            <span className="tabular-figs">9:41</span>
            <span className="flex items-center gap-1">
              <span>5G</span>
              <span className="inline-block h-2.5 w-4 rounded-[2px] border border-white/40" />
            </span>
          </div>

          {/* ストアヘッダー */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-black text-white"
                style={{ background: 'var(--theme-primary)' }}
              >
                R
              </span>
              <span className="text-[11px] font-bold tracking-wide text-white">
                GARAGE ROSSO
              </span>
            </div>
            <MiniPlate />
          </div>

          {/* ヒーロー写真エリア（愛車写真） */}
          <div className="relative h-24 w-full overflow-hidden bg-[#0d0d0d]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lp/hero-car.jpg"
              alt="愛車"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: 'center 42%' }}
            />
            {/* 下部を暗く落としてラベルを読みやすく */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.6) 100%)',
              }}
            />
            <p
              className="absolute bottom-2 left-4 text-[10px] font-medium uppercase tracking-[0.3em] text-white/75"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              ROADSTER
            </p>
          </div>

          {/* ALWAYS WITH YOU カウンター */}
          <div className="px-3.5 pb-1 pt-3">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span
                className="h-px flex-1"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, color-mix(in srgb, var(--theme-accent) 70%, transparent))',
                }}
                aria-hidden
              />
              <p
                className="text-[9px] uppercase"
                style={{
                  fontFamily: 'var(--font-display), sans-serif',
                  letterSpacing: '0.34em',
                  color: '#fff',
                  textShadow:
                    '0 0 14px color-mix(in srgb, var(--theme-accent) 60%, transparent)',
                }}
              >
                Always With You
              </p>
              <span
                className="h-px flex-1"
                style={{
                  background:
                    'linear-gradient(90deg, color-mix(in srgb, var(--theme-accent) 70%, transparent), transparent)',
                }}
                aria-hidden
              />
            </div>
            <div className="grid grid-cols-6 gap-1">
              {cells.map((c, i) => (
                <FlipCell key={i} value={c.value} />
              ))}
            </div>
            <p
              className="mt-1.5 text-center"
              style={{
                fontFamily: 'var(--font-script), cursive',
                fontSize: '1.15rem',
                lineHeight: 1,
                fontStyle: 'italic',
                color: 'color-mix(in srgb, var(--theme-accent) 75%, white)',
              }}
            >
              Keep on rolling.
            </p>
          </div>

          {/* 整備ステータス行 */}
          <div className="space-y-1.5 px-3.5 pb-3 pt-1">
            <StatusRow label="車検満了まで" value="あと 58 日" bar={0.82} alert />
            <StatusRow label="次回オイル交換" value="あと 1,200 km" bar={0.4} />
          </div>

          {/* 予約CTA */}
          <div className="px-3.5 pb-4">
            <div
              className="flex items-center justify-center rounded-xl py-2.5 text-[11px] font-bold text-white shadow-lg"
              style={{ background: 'var(--theme-primary)' }}
            >
              入庫を予約する →
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** ヒーローデバイス内の超ミニ・フリップセル */
function FlipCell({ value }: { value: number }) {
  const padded = String(Math.max(0, value)).padStart(2, '0')
  return (
    <div
      className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[3px]"
      style={{
        background:
          'linear-gradient(180deg, #1e1e1e 0%, #0d0d0d 50%, #0d0d0d 50%, #161616 100%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.5)',
      }}
    >
      <span
        className="text-base font-bold tabular-figs"
        style={{
          fontFamily: 'var(--font-display), sans-serif',
          color: 'rgba(255,255,255,0.96)',
          letterSpacing: '-0.02em',
        }}
      >
        {padded}
      </span>
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        aria-hidden
      />
    </div>
  )
}

/** 整備ステータスの1行（進捗バー付き） */
function StatusRow({
  label,
  value,
  bar,
  alert = false,
}: {
  label: string
  value: string
  bar: number
  alert?: boolean
}) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/60">{label}</span>
        <span
          className="text-[11px] font-bold tabular-figs"
          style={{
            color: alert ? 'var(--theme-primary)' : 'rgba(255,255,255,0.9)',
          }}
        >
          {value}
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.round(bar * 100)}%`,
            background: alert
              ? 'var(--theme-primary)'
              : 'color-mix(in srgb, var(--theme-accent) 80%, white)',
          }}
        />
      </div>
    </div>
  )
}

/** デバイス内の静的ミニ・ナンバープレート（白地に緑） */
function MiniPlate() {
  return (
    <span
      className="inline-flex flex-col items-center rounded-[2px] border leading-none"
      style={{
        background: '#f5f5ef',
        borderColor: '#1f4d2e',
        color: '#1f4d2e',
        padding: '1px 6px 2px',
      }}
    >
      <span className="flex items-baseline gap-1">
        <span style={{ fontSize: '6px', fontWeight: 700 }}>品川</span>
        <span
          className="tabular-figs"
          style={{ fontSize: '7px', fontWeight: 700 }}
        >
          595
        </span>
      </span>
      <span className="flex items-baseline gap-0.5">
        <span style={{ fontSize: '8px', fontWeight: 700 }}>す</span>
        <span
          className="tabular-figs"
          style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.02em' }}
        >
          5-95
        </span>
      </span>
    </span>
  )
}

function diff(from: Date, to: Date) {
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
