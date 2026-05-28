import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { IntegrationsForm } from './form'

export const metadata = {
  title: '外部連携 — くるまカルテ',
}

type ShopIntegrations = {
  line_channel_access_token: string | null
  line_owner_user_id: string | null
  liny_api_key: string | null
  liny_workspace_id: string | null
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { shop } = await getCurrentShop()
  const { saved } = await searchParams

  const admin = createAdminClient()
  const { data: full } = await admin
    .from('shops')
    .select(
      'line_channel_access_token, line_owner_user_id, liny_api_key, liny_workspace_id'
    )
    .eq('id', shop.id)
    .maybeSingle<ShopIntegrations>()

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-8 space-y-2">
        <p className="text-xs text-zinc-500">設定 / 外部連携</p>
        <h1 className="text-2xl font-semibold">🔗 外部連携 (LINE / Liny)</h1>
        <p className="text-sm text-zinc-500">
          LINE公式アカウントと Liny を連携して、車検通知や予約申し込みを LINE で受け取れます。
        </p>
      </header>

      {saved === '1' && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
          ✓ 保存しました
        </div>
      )}

      <IntegrationsForm initial={full ?? null} />

      <div className="mt-10 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <h2 className="text-sm font-semibold">📚 設定ガイド</h2>

        <details>
          <summary className="cursor-pointer font-medium">
            LINE Messaging API の取得方法 ▼
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>LINE Developers (https://developers.line.biz) にログイン</li>
            <li>プロバイダー → チャネル作成 → Messaging API</li>
            <li>チャネル設定の「チャネルアクセストークン」を発行・コピー</li>
            <li>店主自身の LINE userId は Bot 友だち追加 + Webhook で取得 (上級)</li>
          </ol>
        </details>

        <details>
          <summary className="cursor-pointer font-medium">
            Liny の API キーの取得方法 ▼
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Liny 管理画面にログイン</li>
            <li>API設定 (スタンダードプラン以上) → APIキー発行</li>
            <li>ワークスペースID もメモして両方ここに入力</li>
            <li>
              Liny 側で以下のタグを作成しておくとくるまカルテが自動付与します：
              <br />
              kuruma-karte:registered / inspection-3m / inspection-1m /
              inspection-2w / oil-due / dormant / touring-attendee
            </li>
          </ol>
        </details>

        <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          ⚠️ 設定値は暗号化されずにDBに保存されます。Vercel本番では HTTPS なので
          盗聴リスクは低いですが、API キーは漏洩しないよう取り扱いに注意。
        </p>
      </div>
    </main>
  )
}
