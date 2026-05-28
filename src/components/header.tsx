import Link from 'next/link'
import { logout } from '@/app/auth/actions'

export function Header({ shopName }: { shopName: string }) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-base font-semibold">
            くるまカルテ
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-zinc-600 sm:flex dark:text-zinc-400">
            <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-white">
              ダッシュボード
            </Link>
            <Link href="/customers" className="hover:text-zinc-900 dark:hover:text-white">
              お客さん
            </Link>
            <Link href="/reservations" className="hover:text-zinc-900 dark:hover:text-white">
              🗓️ 予約
            </Link>
            <Link href="/settings/theme" className="hover:text-zinc-900 dark:hover:text-white">
              🎨 テーマ
            </Link>
            <Link href="/settings/integrations" className="hover:text-zinc-900 dark:hover:text-white">
              🔗 連携
            </Link>
            <Link href="/flyer" className="hover:text-zinc-900 dark:hover:text-white">
              📄 チラシ
            </Link>
          </nav>
        </div>

        {/* 検索バー (Phase 12-1) */}
        <form
          action="/search"
          method="get"
          className="order-3 flex w-full items-center gap-2 sm:order-none sm:w-auto"
        >
          <div className="relative flex-1 sm:w-64">
            <input
              type="search"
              name="q"
              placeholder="名前・電話・ナンバー・車種で検索"
              className="w-full rounded-md border border-zinc-300 bg-zinc-50 py-1.5 pl-8 pr-3 text-sm placeholder-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:focus:bg-black"
            />
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
              🔍
            </span>
          </div>
        </form>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-zinc-500 sm:inline">{shopName}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
