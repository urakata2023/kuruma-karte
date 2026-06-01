'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '../auth/actions'

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
      <form action={action} className="space-y-4">
        {inviteCode ? (
          <>
            <input type="hidden" name="invite_code" value={inviteCode} />
            <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
              📨 {shopName} からの招待を受けて参加します
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <label htmlFor="shop_name" className="block text-sm font-medium">
                店名
              </label>
              <input
                id="shop_name"
                name="shop_name"
                type="text"
                required
                placeholder="例：◯◯モータース"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="block text-sm font-medium">
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
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <p className="text-xs text-zinc-500">
                お客様への自動通知やサポート連絡に使います。あとから設定画面でも変更できます。
              </p>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            パスワード（8文字以上）
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>

        {state?.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? '登録中…' : 'この内容で登録する'}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          ログイン
        </Link>
      </p>
    </>
  )
}
