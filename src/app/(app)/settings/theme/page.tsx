import { getCurrentShop } from '@/lib/shop'
import { THEMES } from '@/lib/themes'
import { ThemePicker } from './picker'

export const metadata = {
  title: '店舗テーマ — くるまカルテ',
}

export default async function ThemeSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { shop } = await getCurrentShop()
  const { saved } = await searchParams

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-8 space-y-2">
        <p className="text-xs text-zinc-500">設定 / テーマ</p>
        <h1 className="text-2xl font-semibold tracking-tight">🎨 店舗テーマ</h1>
        <p className="text-sm text-zinc-500">
          管理画面とお客様のマイページ（
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            /my/[token]
          </code>
          ）に反映されます。お店のブランディングに合わせて選んでください。
        </p>
      </header>

      {saved === '1' && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
          ✓ テーマを保存しました
        </div>
      )}

      <ThemePicker themes={THEMES} currentThemeId={shop.theme ?? 'default'} />
    </main>
  )
}
