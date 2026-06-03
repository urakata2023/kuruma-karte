'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BrandMark } from '@/components/brand-mark'

type NavItem = {
  href: string
  icon: string
  label: string
  badge?: number
}

/**
 * 管理画面用サイドバー (Phase L)
 *
 * Linear / Stripe 風の固定サイドバー + メインコンテンツ構成。
 * モバイルでは折り畳み (ハンバーガー)。
 * デスクトップでは常時表示の左サイドバー。
 */
export function Sidebar({
  shopName,
  themeId,
  pendingReservationCount = 0,
  isSuperAdmin = false,
}: {
  shopName: string
  themeId: string
  pendingReservationCount?: number
  isSuperAdmin?: boolean
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navMain: NavItem[] = [
    { href: '/dashboard', icon: '📊', label: 'ダッシュボード' },
    { href: '/customers', icon: '👥', label: 'お客さん' },
    {
      href: '/reservations',
      icon: '🗓️',
      label: '予約',
      badge: pendingReservationCount,
    },
    { href: '/activity', icon: '📜', label: '活動履歴' },
  ]

  const navSettings: NavItem[] = [
    { href: '/settings/theme', icon: '🎨', label: 'テーマ' },
    { href: '/settings/members', icon: '👥', label: 'スタッフ' },
    { href: '/settings/integrations', icon: '🔗', label: '外部連携' },
    { href: '/billing', icon: '💳', label: '料金プラン' },
  ]

  const navTools: NavItem[] = [
    { href: '/broadcast', icon: '📣', label: '一括メール配信' },
    { href: '/flyer', icon: '📄', label: 'チラシ印刷' },
  ]

  return (
    <>
      {/* モバイル用ハンバーガー */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border md:hidden"
        style={{
          background: 'var(--surface-1)',
          borderColor: 'var(--hairline)',
          color: 'var(--ink)',
        }}
        aria-label="メニューを開く"
      >
        <span className="text-lg">☰</span>
      </button>

      {/* モバイル用オーバーレイ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* サイドバー本体 */}
      <aside
        data-theme={themeId}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          background: 'var(--surface-1)',
          borderColor: 'var(--hairline)',
          color: 'var(--ink)',
        }}
      >
        {/* ロゴ */}
        <div
          className="flex h-16 items-center justify-between border-b px-5"
          style={{ borderColor: 'var(--hairline)' }}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-base font-semibold tracking-tight"
            style={{ color: 'var(--ink)' }}
            onClick={() => setMobileOpen(false)}
          >
            <BrandMark className="h-7 w-7 shrink-0" />
            くるまカルテ
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden"
            style={{ color: 'var(--ink-subtle)' }}
            aria-label="メニューを閉じる"
          >
            ✕
          </button>
        </div>

        {/* スクロール可能ナビ */}
        <nav className="flex-1 overflow-y-auto p-3">
          <NavGroup title="メイン">
            {navMain.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </NavGroup>

          <NavGroup title="ツール">
            {navTools.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </NavGroup>

          <NavGroup title="設定">
            {navSettings.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </NavGroup>

          {isSuperAdmin && (
            <NavGroup title="Super Admin">
              <NavLink
                item={{ href: '/admin', icon: '👑', label: '俯瞰ダッシュボード' }}
                active={isActive(pathname, '/admin')}
                onClick={() => setMobileOpen(false)}
              />
              <NavLink
                item={{ href: '/admin/shops', icon: '🏢', label: '全店舗一覧' }}
                active={pathname.startsWith('/admin/shops')}
                onClick={() => setMobileOpen(false)}
              />
            </NavGroup>
          )}
        </nav>

        {/* フッター: 店舗名表示 */}
        <div
          className="border-t p-4 text-xs"
          style={{ borderColor: 'var(--hairline)', color: 'var(--ink-subtle)' }}
        >
          <p className="opacity-60">ログイン中</p>
          <p className="mt-0.5 truncate font-medium" style={{ color: 'var(--ink)' }}>
            {shopName}
          </p>
        </div>
      </aside>
    </>
  )
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}

function NavGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <p
        className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--ink-tertiary)' }}
      >
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
      style={{
        background: active ? 'var(--surface-3)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-muted)',
        fontWeight: active ? 600 : 500,
      }}
    >
      <span className="flex items-center gap-2">
        <span className="text-base">{item.icon}</span>
        <span>{item.label}</span>
      </span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      )}
    </Link>
  )
}
