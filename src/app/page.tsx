import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-4">
          <p className="text-sm font-medium text-zinc-500">
            町工場のための、お客様向け愛車マイページ
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            くるまカルテ
          </h1>
          <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            車検のお知らせ、まだハガキで出してますか？
            <br />
            お客さんの愛車情報を、お店もお客さんも見られる場所へ。
            <br />
            車検も、整備も、忘れない関係に。
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            無料で試す（14日間）
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            ログイン
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-6 text-left text-sm sm:grid-cols-3">
          <Feature
            title="車検客を逃さない"
            body="車検満了の3ヶ月前・1ヶ月前・2週間前に、お客様へ自動でメール通知。"
          />
          <Feature
            title="QRで簡単登録"
            body="店頭でQRをお見せするだけ。お客様自身が愛車情報を登録できます。"
          />
          <Feature
            title="月額3,000円から"
            body="車検1台逃さなければ余裕でペイ。導入費用0円・14日無料トライアル。"
          />
        </div>

        <p className="pt-4 text-xs text-zinc-400">
          ※ サービス名は Working Title です（正式名はローンチ前に確定）
        </p>
      </div>
    </div>
  )
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  )
}
