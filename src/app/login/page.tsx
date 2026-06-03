'use client'

import { useActionState } from 'react'
import { login } from '../auth/actions'
import Link from 'next/link'
import { BrandMark } from '@/components/brand-mark'

const RED = 'var(--theme-primary)'
const GOLD = 'var(--theme-accent)'

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[var(--ink)] outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/30 focus:border-[var(--theme-primary)] focus:bg-white/[0.05] focus:ring-2 focus:ring-[var(--theme-primary)]/30'

const labelCls =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div
      data-theme="rosso"
      className="relative flex min-h-[100dvh] flex-col overflow-hidden md:flex-row"
      style={{ background: '#070707', color: 'var(--ink)' }}
    >
      {/* ── 背景テクスチャ（ブループリント＋レッドグロー） ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="lp-grid absolute inset-0 opacity-60" />
        <div
          className="lp-glow absolute -left-32 top-[-10%] h-[480px] w-[480px] rounded-full blur-[120px]"
          style={{
            background:
              'radial-gradient(circle, rgba(220,26,26,0.28), transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] h-[420px] w-[420px] rounded-full blur-[130px]"
          style={{
            background:
              'radial-gradient(circle, rgba(241,197,87,0.10), transparent 70%)',
          }}
        />
      </div>

      {/* ── 左：エディトリアル・パネル ── */}
      <aside className="relative z-10 flex flex-col justify-between px-6 pb-6 pt-10 md:w-[46%] md:px-12 md:py-14 lg:px-16">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 shrink-0 shadow-lg" />
          <span className="text-sm font-bold tracking-wide">くるまカルテ</span>
        </div>

        <div
          className="mt-10 max-w-md md:mt-0"
          style={{ animation: 'lp-rise 0.7s cubic-bezier(0.32,0.72,0,1) both' }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.28em]"
            style={{
              color: GOLD,
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            WELCOME BACK
          </span>
          <h1
            className="mt-5 text-[2.6rem] font-bold leading-[1.04] tracking-tight md:text-[3.1rem]"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            おかえり
            <br />
            <span style={{ color: RED }}>なさい</span>。
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">
            今日も、お客様の愛車と店をつなぐ準備を。ログインして続けましょう。
          </p>
        </div>

        <p className="mt-10 hidden text-[10px] uppercase tracking-[0.3em] text-white/25 md:block">
          ALWAYS WITH YOU
        </p>
      </aside>

      {/* ── 右：フォームカード（Double-Bezel） ── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-12 pt-2 md:py-14 md:pr-12 lg:pr-16">
        <div
          className="w-full max-w-md rounded-[2rem] p-1.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'lp-rise 0.8s cubic-bezier(0.32,0.72,0,1) 0.08s both',
          }}
        >
          <div
            className="rounded-[calc(2rem-0.375rem)] px-6 py-8 sm:px-9 sm:py-10"
            style={{
              background: 'linear-gradient(180deg, #101010 0%, #0b0b0b 100%)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06)',
            }}
          >
            <div className="mb-7">
              <h2 className="text-lg font-bold tracking-tight text-white">
                店舗ログイン
              </h2>
              <p className="mt-1 text-xs text-white/45">
                登録済みのメールアドレスでログイン
              </p>
            </div>

            <form action={action} className="space-y-5">
              <div>
                <label htmlFor="email" className={labelCls}>
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="password" className={labelCls}>
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>

              {state?.error && (
                <p
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    border: '1px solid rgba(220,26,26,0.35)',
                    background: 'rgba(220,26,26,0.1)',
                    color: '#ff8b8b',
                  }}
                >
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="group relative flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: 'var(--theme-primary)' }}
              >
                {pending ? 'ログイン中…' : 'ログイン'}
                {!pending && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-base transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
                    →
                  </span>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/45">
              初めてのご利用は{' '}
              <Link
                href="/signup"
                className="font-semibold text-white underline-offset-4 transition-colors hover:text-[var(--theme-accent)] hover:underline"
              >
                新規登録
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
