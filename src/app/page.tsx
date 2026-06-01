import Link from 'next/link'

/**
 * 公開LP (Phase E)
 *
 * サービス名: 「くるまカルテ」(正式確定。Working Title から正式採用へ昇格)
 * ターゲット: 1〜10名規模の整備工場・町工場の店主
 */
export const metadata = {
  title: 'くるまカルテ｜町工場のための、お客様向け愛車マイページSaaS',
  description:
    '車検通知・整備記録・お客様マイページを一気通貫で。AIが「次の整備」をお客様にお伝えし、町工場の顧客リテンションを最大化します。',
}

export default function LP() {
  return (
    <div className="flex flex-1 flex-col">
      {/* シンプルヘッダー */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <p className="text-base font-semibold">くるまカルテ</p>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              30日無料で試す
            </Link>
          </nav>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-blue-50 px-6 py-20 dark:border-zinc-800 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 inline-block rounded-full bg-zinc-900 px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-white dark:bg-white dark:text-black">
            For 町工場 / 整備工場
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            町工場のための、
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              「お客様のための」愛車マイページ
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
            車検通知をハガキで送る時代は終わりました。
            <br />
            AIが車を診断し、お客様自身がスマホで愛車を確認し、
            <br className="hidden sm:inline" />
            自然に予約と整備が回り続ける。
            <br />
            <span className="font-semibold text-zinc-900 dark:text-white">
              それが、くるまカルテです。
            </span>
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-zinc-800 dark:bg-white dark:text-black"
            >
              30日無料で試す →
            </Link>
            <Link
              href="#features"
              className="rounded-full border border-zinc-300 bg-white px-8 py-3.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              機能を見る
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-500">
            ✓ クレジットカード登録不要 ✓ 30日無料トライアル ✓ いつでも解約可能
          </p>
        </div>
      </section>

      {/* 問題提起 */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
            こんなお悩み、ありませんか？
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold sm:text-3xl">
            町工場の8割が抱える「顧客流出」
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Pain
              icon="📮"
              title="ハガキ送っても無視される"
              body="開封率は10%以下。お客様の手元に届かず、車検客を取り逃がす日々。"
            />
            <Pain
              icon="📒"
              title="顧客情報がノートのまま"
              body="紙の台帳とエクセル。「あの白いハイエース、いつ車検だっけ?」を10分かけて探す。"
            />
            <Pain
              icon="🥲"
              title="ディーラーに持っていかれる"
              body="ディーラーは My◯◯ アプリでフォロー万全。町工場は何もできず、お客様を奪われる。"
            />
          </div>
        </div>
      </section>

      {/* ソリューション ヒーロー */}
      <section className="border-y border-zinc-200 bg-zinc-900 px-6 py-20 text-white dark:border-zinc-800">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            くるまカルテができること
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            「忘れられない店」になる、
            <br />
            たった1つの仕組み。
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-300">
            お客様のスマホに、あなたのお店専用の「愛車マイページ」が常駐します。
            <br />
            車検も、整備も、思い出も、ぜんぶそこに。
            <br />
            <span className="font-semibold text-white">
              お客様の生活に溶け込んで、もう離れない。
            </span>
          </p>
        </div>
      </section>

      {/* 機能 6本 */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Key Features
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold sm:text-3xl">
            町工場に必要な機能、ぜんぶ。
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon="🪄"
              title="車検証の写真でAI自動入力"
              body="お客様が車検証を撮るだけで、Claude AIがナンバー・車検満了日・車種を読み取って自動入力。電子車検証(2023年〜)にも対応。"
            />
            <Feature
              icon="💡"
              title="AIが「次の整備」を提案"
              body="走行距離・整備履歴・季節要因をAIが分析し、お客様に「次にやるべき整備」を3つ提案。店主にも「電話の話題」を自動生成。"
            />
            <Feature
              icon="🗓️"
              title="お客様から入庫予約"
              body="マイページから「次回オイル交換予約」「車検予約」をお客様が自分で申請。店主はワンタップで承認、LINEで通知。"
            />
            <Feature
              icon="🔔"
              title="車検通知 完全自動化"
              body="車検3ヶ月前・1ヶ月前・2週間前に、メール+LINE自動配信。Liny (Lステップ系) との連携で既存配信フローと共存。"
            />
            <Feature
              icon="🎨"
              title="店舗ブランドカラー"
              body="Rosso、Premium Black、Bavarian Blueなど6テーマ。お店の世界観をマイページにも反映してブランドを強化。"
            />
            <Feature
              icon="📸"
              title="整備の Before/After 写真"
              body="整備記録に作業前後の写真を添付。お客様に「ちゃんとやってくれた」が伝わり、信頼が積み上がる。"
            />
          </div>
        </div>
      </section>

      {/* "お客様向け" 体験 */}
      <section className="border-y border-zinc-200 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-6 py-20 dark:border-zinc-800 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
            B2B2C: 競合と決定的に違う点
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            お客様自身が、
            <br />
            スマホで愛車を眺める時間が増える。
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Showcase
              icon="⏱️"
              title="ALWAYS WITH YOU"
              body="愛車との時間をリアルタイムで刻むカウンター。02y 05m 12d 08h 15m 32s と1秒単位で記録。"
            />
            <Showcase
              icon="🛣️"
              title="ツーリングの記録"
              body="行った場所を地図にピンで残せる。愛車との思い出が、お店経由で蓄積されていく。"
            />
            <Showcase
              icon="📤"
              title="シェアで自然拡散"
              body="マイページをLINEやTwitterで共有可能。「うちもこれにしたい」と他の車仲間が来店してくれる導線。"
            />
          </div>
        </div>
      </section>

      {/* プラン */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
            シンプルな料金体系
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold sm:text-3xl">
            車検1台で、ペイします。
          </h2>
          <p className="mt-3 text-center text-sm text-zinc-500">
            車検整備の利益は1台あたり数万円。月間1台多く逃さなければ、ペイ。
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <PlanCard
              name="スタンダード"
              price={4980}
              tagline="始めての方におすすめ"
              limit="お客様 200名まで"
              features={[
                'お客様マイページ',
                '車検3ヶ月/1ヶ月/2週間前メール通知',
                'AI整備提案エンジン',
                '車検証写真OCR',
                '整備記録 + Before/After 写真',
                '入庫予約管理',
                '店舗テーマカラー',
              ]}
            />
            <PlanCard
              name="プロ"
              price={9800}
              tagline="LINE 配信を本気でやる方"
              limit="お客様 無制限"
              recommended
              features={[
                'スタンダードのすべて',
                'LINE Messaging API 連携',
                'Liny / Lステップ系 タグ連携',
                'マルチスタッフ (3名まで)',
                '優先サポート',
                '今後の新機能 優先アクセス',
              ]}
            />
          </div>

          <p className="mt-6 text-center text-xs text-zinc-500">
            ✓ 30日無料トライアル ✓ クレジットカード登録不要 ✓ いつでも解約可能
          </p>
        </div>
      </section>

      {/* CTA 最終 */}
      <section className="border-y border-zinc-200 bg-zinc-900 px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            車検客を逃さない店に、なる。
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-300">
            ハガキ印刷代より安い金額で、お客様との関係を一生モノに。
            <br />
            まずは30日、無料で全機能をお試しください。
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-full bg-white px-10 py-4 text-base font-bold text-black shadow-xl hover:bg-zinc-200"
          >
            くるまカルテを30日無料で始める →
          </Link>
          <p className="mt-4 text-xs text-zinc-500">
            登録3分。クレジットカード登録不要。
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold">よくあるご質問</h2>
          <div className="mt-8 space-y-3">
            <Faq
              q="お客様にPCやアプリのダウンロードは必要?"
              a="いいえ。スマホのブラウザだけでOK。お渡しするQRをカメラで撮るだけで、マイページが開きます。"
            />
            <Faq
              q="既に CarRide や他社サービスを使っているのですが…"
              a="他社は業務効率化ツールなので、くるまカルテ (お客様向け体験) と併用が可能です。"
            />
            <Faq
              q="お客様データは安全ですか?"
              a="国内サーバー (Supabase / Vercel) で暗号化保管。各店舗の情報は完全に分離されます。"
            />
            <Faq
              q="既存の Liny / Lステップは活かせますか?"
              a="はい。プロプランで API 連携可能。くるまカルテは「タグを付ける」役割で、配信文面は今までの Liny シナリオをそのまま使えます。"
            />
            <Faq
              q="お客様への押し付け感が心配です"
              a="マイページは「お客様の愛車のページ」として作っています。お客様が見たくなる仕掛け (ALWAYS WITH YOU・思い出ギャラリー) で、自然に開いてくれる設計です。"
            />
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-10 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold">くるまカルテ</p>
          <p className="mt-1 text-xs text-zinc-500">
            町工場のための、お客様向け愛車マイページSaaS
          </p>
          <nav className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">
            <a
              href="https://urakata.biz/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              運営：株式会社UrakaTA
            </a>
            <span aria-hidden className="text-zinc-300 dark:text-zinc-700">
              ·
            </span>
            <a
              href="https://urakata.biz/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              プライバシーポリシー
            </a>
            <span aria-hidden className="text-zinc-300 dark:text-zinc-700">
              ·
            </span>
            <Link
              href="/legal/tokushou"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              特定商取引法に基づく表記
            </Link>
          </nav>
          <p className="mt-4 text-[10px] text-zinc-400">
            Powered by Anthropic Claude / Supabase / Vercel · © UrakaTA Inc.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Pain({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 text-left dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-3xl">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  )
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) {
  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600">
      <div className="text-3xl transition-transform group-hover:scale-110">
        {icon}
      </div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
    </div>
  )
}

function Showcase({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl bg-white/70 p-5 text-left shadow-sm backdrop-blur dark:bg-black/30">
      <div className="text-3xl">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{body}</p>
    </div>
  )
}

function PlanCard({
  name,
  price,
  tagline,
  limit,
  features,
  recommended = false,
}: {
  name: string
  price: number
  tagline: string
  limit: string
  features: string[]
  recommended?: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl border-2 p-7 ${
        recommended
          ? 'border-zinc-900 bg-white shadow-xl dark:border-white dark:bg-black'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black'
      }`}
    >
      {recommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-1 text-[10px] font-semibold text-white dark:bg-white dark:text-black">
          ⭐ おすすめ
        </span>
      )}
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="mt-1 text-xs text-zinc-500">{tagline}</p>
      <p className="mt-4">
        <span className="text-4xl font-bold">¥{price.toLocaleString()}</span>
        <span className="ml-1 text-sm text-zinc-500">/月 (税別)</span>
      </p>
      <p className="mt-1 text-xs text-zinc-500">{limit}</p>

      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className={`mt-6 block w-full rounded-md px-4 py-3 text-center text-sm font-semibold ${
          recommended
            ? 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black'
            : 'border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900'
        }`}
      >
        このプランで始める
      </Link>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="cursor-pointer text-sm font-semibold">
        Q. {q}
      </summary>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        A. {a}
      </p>
    </details>
  )
}
