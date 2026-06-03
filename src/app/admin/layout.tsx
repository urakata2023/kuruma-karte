import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/admin-auth'
import { logout } from '@/app/auth/actions'

/**
 * /admin/* 共通レイアウト
 *
 * proxy.ts でガード済みだが、サーバーコンポーネント側でも requireSuperAdmin で
 * 二重に防御する（envが未設定の状態でデプロイされた場合の保険）。
 *
 * 通常の店舗UIとは別世界のトーン（黒×ゴールド）で「俯瞰してる感」を出す。
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSuperAdmin()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <header className="border-b border-zinc-800 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="text-base">👑</span>
              <span className="text-sm font-semibold tracking-wide text-zinc-100">
                くるまカルテ Admin
              </span>
              <span className="rounded-full border border-amber-700/40 bg-amber-900/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
                Super
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-400">
              <Link
                href="/admin"
                className="hover:text-zinc-100"
              >
                ダッシュボード
              </Link>
              <Link
                href="/admin/shops"
                className="hover:text-zinc-100"
              >
                店舗一覧
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-zinc-700 px-3 py-1 text-xs hover:bg-zinc-900"
              >
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
