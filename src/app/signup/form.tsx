'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '../auth/actions'

const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[var(--ink)] outline-none transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-white/30 focus:border-[var(--theme-primary)] focus:bg-white/[0.05] focus:ring-2 focus:ring-[var(--theme-primary)]/30'

const labelCls =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55'

export function SignupForm({
  inviteCode,
  shopName,
}: {
  inviteCode: string | null
  shopName: string | null
}) {
  const [state, action, pending] = useActionState(signup, undefined)

  return (
    <>
      <form action={action} className="space-y-5">
        {inviteCode ? (
          <>
            <input type="hidden" name="invite_code" value={inviteCode} />
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                border: '1px solid rgba(241,197,87,0.3)',
                background: 'rgba(241,197,87,0.08)',
                color: 'var(--theme-accent)',
              }}
            >
              📨 {shopName} からの招待を受けて参加します
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="shop_name" className={labelCls}>
                店名
              </label>
              <input
                id="shop_name"
                name="shop_name"
                type="text"
                required
                placeholder="例：◯◯モータース"
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="phone" className={labelCls}>
                お店の電話番号
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="例：03-1234-5678"
                pattern="[0-9\-\+\s\(\)]{10,15}"
                className={inputCls}
              />
              <p className="mt-1.5 text-xs leading-relaxed text-white/35">
                お客様への自動通知やサポート連絡に使います。あとから設定画面でも変更できます。
              </p>
            </div>
          </>
        )}

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
            パスワード（8文字以上）
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
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
          {pending ? '登録中…' : inviteCode ? 'この内容で参加する' : 'この内容で登録する'}
          {!pending && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-base transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
              →
            </span>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/45">
        すでにアカウントをお持ちの方は{' '}
        <Link
          href="/login"
          className="font-semibold text-white underline-offset-4 transition-colors hover:text-[var(--theme-accent)] hover:underline"
        >
          ログイン
        </Link>
      </p>
    </>
  )
}
