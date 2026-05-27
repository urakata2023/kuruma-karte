import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function RegistrationDonePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ name?: string; view?: string }>
}) {
  const { token } = await params
  const { name, view } = await searchParams
  const admin = createAdminClient()
  const { data: shop } = await admin
    .from('shops')
    .select('name, phone')
    .eq('registration_token', token)
    .maybeSingle<{ name: string; phone: string | null }>()

  if (!shop) notFound()

  // 初回はオンボーディングを出すため ?welcome=1 を付与
  const myPageUrl = view ? `/my/${view}?welcome=1` : null

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-8">
        {/* 完了 */}
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600 dark:bg-green-950 dark:text-green-400">
            ✓
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              登録ありがとうございます
            </h1>
            <p className="mt-3 text-sm text-zinc-500">
              {name ? `${name} 様、` : ''}
              {shop.name}への愛車登録が完了しました。
            </p>
          </div>
        </div>

        {/* 主要アクション：マイページへ */}
        {myPageUrl && (
          <Link
            href={myPageUrl}
            className="block w-full rounded-md bg-zinc-900 px-4 py-4 text-center text-base font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            あなたの愛車マイページを見る →
          </Link>
        )}

        {/* メール送信案内 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
          <p className="flex items-center gap-2 text-sm font-medium">
            📧 マイページのURLをメールでお送りしました
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            ご登録のメールアドレスに、いつでもマイページを開けるURLを
            お送りしましたのでご確認ください。
          </p>
        </div>

        {/* ホーム画面追加の案内 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
          <p className="text-sm font-semibold">
            📱 ホーム画面に追加するといつでも一発で開けます
          </p>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
              iPhone（Safari）の方法 ▼
            </summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-zinc-600 dark:text-zinc-400">
              <li>マイページを開いた状態で、下の「共有」ボタンをタップ</li>
              <li>メニューを下にスクロールして「ホーム画面に追加」を選択</li>
              <li>右上の「追加」をタップ</li>
            </ol>
          </details>

          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Android（Chrome）の方法 ▼
            </summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-zinc-600 dark:text-zinc-400">
              <li>右上の「︙」メニューをタップ</li>
              <li>「ホーム画面に追加」を選択</li>
            </ol>
          </details>
        </div>

        {/* お店連絡先 */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
          <p className="text-xs text-zinc-500">お困りの場合は</p>
          <p className="mt-1 text-sm font-semibold">{shop.name}</p>
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="mt-2 inline-block text-sm font-medium text-blue-600 underline dark:text-blue-400"
            >
              📞 {shop.phone}
            </a>
          )}
          <p className="mt-2 text-xs text-zinc-500">
            お気軽にお問い合わせください。
          </p>
        </div>

        <p className="text-center text-xs text-zinc-400">
          Powered by くるまカルテ
        </p>
      </div>
    </div>
  )
}
