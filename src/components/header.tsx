import Link from 'next/link'
import { logout } from '@/app/auth/actions'

export function Header({ shopName }: { shopName: string }) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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
            <Link href="/settings/theme" className="hover:text-zinc-900 dark:hover:text-white">
              🎨 テーマ
            </Link>
            <Link href="/flyer" className="hover:text-zinc-900 dark:hover:text-white">
              📄 チラシ
            </Link>
          </nav>
        </div>
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
