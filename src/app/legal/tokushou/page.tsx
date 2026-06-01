import Link from 'next/link'

export const metadata = {
  title: '特定商取引法に基づく表記 — くるまカルテ',
}

/**
 * 特定商取引法に基づく表記
 *
 * SaaS（くるまカルテ）の有料プラン販売における事業者情報の開示。
 * 法令で必須の項目を網羅。記載値は urakata.biz の情報および
 * 翔太さんから受領した内容にあわせて随時更新する。
 */
export default function TokushouPage() {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: '販売事業者', value: '株式会社UrakaTA' },
    {
      label: '運営責任者',
      value: '佐藤 翔太',
    },
    {
      label: '所在地',
      value: (
        <>
          詳細はお問い合わせいただいた際に遅滞なく開示いたします。
          <br />
          代表ページ:{' '}
          <a
            href="https://urakata.biz/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-900 dark:hover:text-white"
          >
            https://urakata.biz/
          </a>
        </>
      ),
    },
    {
      label: 'お問い合わせ',
      value: (
        <>
          <a
            href="mailto:sato@urakata.biz"
            className="underline hover:text-zinc-900 dark:hover:text-white"
          >
            sato@urakata.biz
          </a>
          （平日10:00〜18:00 / 土日祝休業）
        </>
      ),
    },
    {
      label: '販売価格',
      value: (
        <>
          スタンダードプラン：月額 4,980円（税別）
          <br />
          プロプラン：月額 9,800円（税別）
          <br />
          ※ 価格は申込みページに常時表示しています。
        </>
      ),
    },
    {
      label: '商品代金以外の費用',
      value: '消費税、通信料（インターネット接続料金）はお客様負担となります。',
    },
    {
      label: 'お支払い方法',
      value:
        'クレジットカード決済（Stripe を利用）。VISA / Mastercard / JCB / American Express / Diners Club に対応。',
    },
    {
      label: 'お支払い時期',
      value:
        '初回はサブスクリプション開始日、以降は毎月の更新日に自動で課金されます。',
    },
    {
      label: 'サービス提供時期',
      value: 'お申込み（決済）完了後、ただちにご利用いただけます。',
    },
    {
      label: '無料トライアル',
      value:
        '新規ご登録から30日間は無料でお試しいただけます。トライアル期間中は課金されません。',
    },
    {
      label: '解約について',
      value: (
        <>
          いつでも管理画面（料金プラン → Stripe顧客ポータル）から解約できます。
          <br />
          解約後も次回更新日まではご利用いただけます。日割り返金は行いません。
        </>
      ),
    },
    {
      label: '返金について',
      value:
        'デジタルサービスの性質上、お客様都合による返金は原則お受けしておりません。重大な不具合等の場合は個別にご相談ください。',
    },
    {
      label: '動作環境',
      value:
        '最新版の Google Chrome / Safari / Edge / Firefox。スマートフォンは iOS Safari 16以上 / Android Chrome 最新版を推奨します。',
    },
    {
      label: 'プライバシー',
      value: (
        <a
          href="https://urakata.biz/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-zinc-900 dark:hover:text-white"
        >
          プライバシーポリシー
        </a>
      ),
    },
  ]

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-12">
      <header className="space-y-1">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          ← くるまカルテに戻る
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          特定商取引法に基づく表記
        </h1>
        <p className="text-sm text-zinc-500">
          くるまカルテ（SaaS）の有料プラン提供にあたっての事業者情報を開示します。
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <dl className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((r) => (
            <div
              key={r.label}
              className="grid gap-2 px-5 py-4 sm:grid-cols-[200px_1fr] sm:gap-6"
            >
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {r.label}
              </dt>
              <dd className="text-sm text-zinc-900 dark:text-zinc-100">
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-xs text-zinc-500">
        最終更新日：2026年6月1日 ／ 株式会社UrakaTA
      </p>
    </main>
  )
}
