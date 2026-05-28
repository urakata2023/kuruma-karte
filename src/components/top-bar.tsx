import Link from 'next/link'
import { logout } from '@/app/auth/actions'
import { SearchBar } from '@/components/search-bar'

/**
 * 管理画面のトップバー (Phase L + L+)
 *
 * - 左: インクリメンタル検索バー (Spotlight 風)
 * - 右: トライアル表示 + ログアウト
 */
export function TopBar() {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b px-6 backdrop-blur-md"
      style={{
        background: 'color-mix(in srgb, var(--canvas) 85%, transparent)',
        borderColor: 'var(--hairline)',
      }}
    >
      <div className="ml-12 flex-1 md:ml-0">
        <SearchBar />
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/billing"
          className="hidden rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:inline-flex"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--ink-muted)',
          }}
        >
          無料トライアル中
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              borderColor: 'var(--hairline)',
              color: 'var(--ink-muted)',
            }}
          >
            ログアウト
          </button>
        </form>
      </div>
    </header>
  )
}
