import { getCurrentShop } from '@/lib/shop'
import { createAdminClient } from '@/lib/supabase/admin'
import { BroadcastForm } from './form'
import { CUSTOMER_TAGS } from '@/lib/customer-tags'

export const metadata = {
  title: '一括メール配信 — くるまカルテ',
}

export default async function BroadcastPage() {
  const { shop } = await getCurrentShop()
  const admin = createAdminClient()

  // メアド登録顧客数（タグ別）
  const { data: allCust } = await admin
    .from('customers')
    .select('id, email, tags')
    .eq('shop_id', shop.id)

  const withEmail = (allCust ?? []).filter((c) => c.email)
  const totalCount = withEmail.length

  const tagCounts: Record<string, number> = {}
  for (const c of withEmail) {
    for (const t of (c.tags ?? []) as string[]) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
      <header className="space-y-1">
        <p
          className="text-eyebrow"
          style={{ color: 'var(--ink-tertiary)' }}
        >
          Broadcast
        </p>
        <h1
          className="text-headline"
          style={{ color: 'var(--ink)' }}
        >
          📣 一括メール配信
        </h1>
        <p
          className="text-sm"
          style={{ color: 'var(--ink-subtle)' }}
        >
          全顧客 / タグ絞り込み で、HTML メールを一斉配信できます。
        </p>
      </header>

      {totalCount === 0 ? (
        <div
          className="rounded-xl border border-dashed p-8 text-center text-sm"
          style={{
            borderColor: 'var(--hairline)',
            color: 'var(--ink-subtle)',
          }}
        >
          メールアドレスが登録されているお客様がまだいません。
        </div>
      ) : (
        <BroadcastForm
          totalCount={totalCount}
          tagCounts={tagCounts}
          tags={CUSTOMER_TAGS}
        />
      )}

      <aside
        className="rounded-xl border p-5 text-xs"
        style={{
          background: 'var(--surface-2)',
          borderColor: 'var(--hairline)',
          color: 'var(--ink-muted)',
        }}
      >
        <p className="font-semibold">⚠️ 送信前のご注意</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>本番では Resend の独自ドメイン認証が必要 (現在は自分宛のみ届く)</li>
          <li>件数が多いと配信に時間がかかります（1秒/件目安）</li>
          <li>配信内容は活動履歴 (📜 履歴) で確認できます</li>
          <li>商業的すぎる内容は迷惑メール判定される可能性あり</li>
        </ul>
      </aside>
    </main>
  )
}
