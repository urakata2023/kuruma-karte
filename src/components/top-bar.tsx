import Link from 'next/link'
import { logout } from '@/app/auth/actions'

/**
 * 管理画面のトップバー (Phase L)
 *
 * サイドバーレイアウトの右側、コンテンツ上部に固定。
 * 検索バー + ログアウトボタン + 軽い装飾。
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
      {/* 検索バー */}
      <form
        action="/search"
        method="get"
        className="ml-12 flex-1 max-w-md md:ml-0"
      >
        <div className="relative">
          <input
            type="search"
            name="q"
            placeholder="名前・電話・ナンバー・車種で検索…"
            className="w-full rounded-lg border bg-transparent py-2 pl-10 pr-3 text-sm placeholder-zinc-400 focus:outline-none"
            style={{
              borderColor: 'var(--hairline)',
              color: 'var(--ink)',
            }}
          />
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: 'var(--ink-subtle)' }}
          >
            🔍
          </span>
        </div>
      </form>

      {/* 右側アクション */}
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
