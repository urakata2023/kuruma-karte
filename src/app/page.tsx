import Link from 'next/link'
import { LpHeroDevice } from '@/components/lp-hero-device'
import { BrandMark } from '@/components/brand-mark'

/**
 * 公開LP (Phase E → リデザイン)
 *
 * サービス名: 「くるまカルテ」
 * ターゲット: 1〜10名規模の整備工場・町工場の店主
 *
 * デザイン路線: モータースポーツ・エディトリアル
 *   マットブラック × レーシングレッド × ゴールド（Rossoテーマを全面採用）
 *   ナンバープレート / ライブカウンター「ALWAYS WITH YOU」など
 *   実プロダクトの資産をそのままヒーローへ。
 *
 * 配色は最上位の data-theme="rosso" から
 *   --theme-primary  = #dc1a1a (レーシングレッド)
 *   --theme-accent   = #f1c557 (ゴールド)
 * を継承する。
 */
export const metadata = {
  title: 'くるまカルテ｜町工場のための、お客様向け愛車マイページSaaS',
  description:
    '車検通知・整備記録・お客様マイページを一気通貫で。AIが「次の整備」をお客様にお伝えし、町工場の顧客リテンションを最大化します。ディーラーに、客を渡すな。',
}

const RED = 'var(--theme-primary)'
const GOLD = 'var(--theme-accent)'

export default function LP() {
  return (
    <div
      data-theme="rosso"
      className="flex flex-1 flex-col overflow-x-hidden"
      style={{ background: '#070707', color: '#fafafa' }}
    >
      {/* ───────── ヘッダー ───────── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          background: 'rgba(7,7,7,0.72)',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7 shrink-0" />
            <span className="text-sm font-bold tracking-wide">くるまカルテ</span>
          </div>
          <nav className="flex items-center gap-2 text-sm sm:gap-4">
            <Link
              href="#features"
              className="hidden text-xs font-medium text-white/55 transition-colors hover:text-white sm:inline"
            >
              機能
            </Link>
            <Link
              href="#pricing"
              className="hidden text-xs font-medium text-white/55 transition-colors hover:text-white sm:inline"
            >
              料金
            </Link>
            <Link
              href="/login"
              className="text-xs font-medium text-white/70 transition-colors hover:text-white"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.03]"
              style={{ background: RED }}
            >
              30日 無料で試す
            </Link>
          </nav>
        </div>
      </header>

      {/* ───────── ヒーロー ───────── */}
      <section className="relative overflow-hidden">
        {/* ブループリント・グリッド */}
        <div className="lp-grid pointer-events-none absolute inset-0 opacity-70" />
        {/* レッドの斜め光 */}
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 30%, transparent), transparent 70%)',
          }}
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          {/* 左: コピー */}
          <div>
            <div className="flex items-center gap-3">
              <span
                className="h-px w-8"
                style={{ background: RED }}
                aria-hidden
              />
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55"
                style={{ fontFamily: 'var(--font-display), sans-serif' }}
              >
                For Independent Garages
              </p>
            </div>

            <h1
              className="mt-6 font-bold tracking-tight"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 'clamp(2.5rem, 6.5vw, 4.6rem)',
                lineHeight: 0.98,
                letterSpacing: '-0.03em',
              }}
            >
              ディーラーに、
              <br />
              <span style={{ color: RED }}>客を渡すな。</span>
            </h1>

            <p className="mt-7 max-w-md text-[15px] leading-relaxed text-white/65">
              車検のお知らせを、ハガキで送る。
              <span className="text-white/90">
                {' '}
                その時点で、もう負けている。
              </span>
              <br />
              くるまカルテは、お客様のスマホに
              <span className="font-semibold text-white">
                「あなたの店専用の愛車マイページ」
              </span>
              を常駐させる。車検も整備も思い出も、ぜんぶそこに。もう、離れない。
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-xl transition-transform hover:scale-[1.03]"
                style={{ background: RED }}
              >
                30日 無料で全機能を試す
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-full border px-7 py-3.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.16)' }}
              >
                機能を見る
              </Link>
            </div>

            <p className="mt-5 text-[11px] tracking-wide text-white/40">
              ✓ カード登録不要　✓ 30日無料トライアル　✓ いつでも解約可能
            </p>
          </div>

          {/* 右: スマホ・モックアップ */}
          <div className="flex justify-center lg:justify-end">
            <LpHeroDevice />
          </div>
        </div>
      </section>

      {/* ───────── ティッカー ───────── */}
      <div
        className="relative flex overflow-hidden border-y py-3"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          background: RED,
        }}
      >
        <div className="lp-marquee flex shrink-0 items-center gap-6 whitespace-nowrap pr-6">
          {Array.from({ length: 2 }).map((_, dup) => (
            <span key={dup} className="flex items-center gap-6">
              {TICKER.map((t, i) => (
                <span key={`${dup}-${i}`} className="flex items-center gap-6">
                  <span
                    className="text-sm font-bold uppercase tracking-wider text-white"
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    {t}
                  </span>
                  <span className="text-white/50">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ───────── 01 課題 ───────── */}
      <section className="relative px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionLabel index="01" en="The Problem" jp="なぜ、客に忘れられるのか" />
          <h2
            className="mt-8 max-w-3xl font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(1.8rem, 4.5vw, 3rem)',
              lineHeight: 1.08,
            }}
          >
            町工場の8割が、
            <br />
            気づかぬうちに
            <span style={{ color: RED }}>「顧客流出」</span>
            している。
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Pain
              n="01"
              title="ハガキは、もう読まれない"
              body="車検案内ハガキの開封率は10%以下。お客様の手元に届かないまま、車検客を毎月取りこぼしている。"
            />
            <Pain
              n="02"
              title="顧客情報が、ノートのまま"
              body="紙の台帳とエクセル。「あの白いハイエース、いつ車検だっけ？」を探すのに10分かかる。"
            />
            <Pain
              n="03"
              title="ディーラーは、抱え込む"
              body="My◯◯ アプリでフォロー万全のディーラー。武器を持たない町工場は、静かに客を奪われていく。"
            />
          </div>
        </div>
      </section>

      {/* ───────── 02 ソリューション宣言（フルブリード） ───────── */}
      <section
        className="relative overflow-hidden border-y px-5 py-24 sm:px-8 lg:py-32"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="lp-glow pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--theme-primary) 22%, transparent), transparent 70%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <SectionLabel
            index="02"
            en="The Answer"
            jp="くるまカルテができること"
            center
          />
          <h2
            className="mx-auto mt-8 max-w-3xl font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(2rem, 5vw, 3.4rem)',
              lineHeight: 1.05,
            }}
          >
            「忘れられない店」になる、
            <br />
            たった
            <span style={{ color: GOLD }}>1つ</span>
            の仕組み。
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-[15px] leading-relaxed text-white/65">
            お客様のスマホに常駐する、あなたの店専用の愛車マイページ。
            <br className="hidden sm:block" />
            車検も、整備も、ツーリングの思い出も、ぜんぶそこに集まる。
            <br className="hidden sm:block" />
            <span className="font-semibold text-white">
              お客様の生活に溶け込んで、もう離れない。
            </span>
          </p>
        </div>
      </section>

      {/* ───────── 03 機能 ───────── */}
      <section id="features" className="relative px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionLabel
            index="03"
            en="Key Features"
            jp="町工場に必要な機能、ぜんぶ"
          />
          <h2
            className="mt-8 max-w-3xl font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(1.8rem, 4.5vw, 3rem)',
              lineHeight: 1.08,
            }}
          >
            道具は、揃っている。
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3"
            style={{
              borderColor: 'rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            <Feature
              n="01"
              icon="🪄"
              title="車検証の写真でAI自動入力"
              body="お客様が車検証を撮るだけ。Claude AIがナンバー・車検満了日・車種を読み取り自動入力。電子車検証（2023年〜）にも対応。"
            />
            <Feature
              n="02"
              icon="💡"
              title="AIが「次の整備」を提案"
              body="走行距離・整備履歴・季節要因をAIが分析し、お客様に次の整備を3つ提案。店主には「電話の話題」も自動生成。"
            />
            <Feature
              n="03"
              icon="🗓️"
              title="お客様から入庫予約"
              body="マイページからオイル交換・車検をお客様自身が申請。店主はワンタップ承認、LINEで即通知。"
            />
            <Feature
              n="04"
              icon="🔔"
              title="車検通知 完全自動化"
              body="3ヶ月前・1ヶ月前・2週間前に、メール+LINEを自動配信。Liny / Lステップ系との連携で既存フローと共存。"
            />
            <Feature
              n="05"
              icon="🎨"
              title="店舗ブランドカラー"
              body="Rosso、Premium Black、Bavarian Blueなど6テーマ。お店の世界観をマイページにも反映してブランドを強化。"
            />
            <Feature
              n="06"
              icon="📸"
              title="整備の Before / After"
              body="整備記録に作業前後の写真を添付。「ちゃんとやってくれた」が伝わり、信頼が積み上がる。"
            />
          </div>
        </div>
      </section>

      {/* ───────── 04 お客様体験 (B2B2C) ───────── */}
      <section
        className="relative overflow-hidden border-y px-5 py-20 sm:px-8 lg:py-28"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          background:
            'linear-gradient(180deg, #0a0a0a 0%, #120909 50%, #0a0a0a 100%)',
        }}
      >
        <div className="mx-auto max-w-6xl">
          <SectionLabel
            index="04"
            en="Customer Experience"
            jp="競合と決定的に違う点"
          />
          <h2
            className="mt-8 max-w-3xl font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(1.8rem, 4.5vw, 3rem)',
              lineHeight: 1.08,
            }}
          >
            お客様が、自分から
            <br />
            <span style={{ color: GOLD }}>スマホを開きたくなる。</span>
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/65">
            業務効率化ツールは星の数ほどある。けれど、
            <span className="text-white/90">お客様自身が見たくなる</span>
            体験を作れるのは、くるまカルテだけ。
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Showcase
              icon="⏱️"
              title="ALWAYS WITH YOU"
              body="愛車との時間を1秒単位で刻むライブカウンター。フリップクロック風の演出で、つい眺めたくなる。"
            />
            <Showcase
              icon="🛣️"
              title="ツーリングの記録"
              body="行った場所を地図にピンで残せる。愛車との思い出が、お店経由で蓄積されていく。"
            />
            <Showcase
              icon="📤"
              title="シェアで自然拡散"
              body="マイページをLINE / X で共有可能。「うちもこれにしたい」と車仲間が来店してくれる導線に。"
            />
          </div>
        </div>
      </section>

      {/* ───────── 05 料金 ───────── */}
      <section id="pricing" className="relative px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <SectionLabel index="05" en="Pricing" jp="車検1台で、ペイする" center />
          <h2
            className="mt-8 text-center font-bold tracking-tight"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(1.8rem, 4.5vw, 3rem)',
              lineHeight: 1.08,
            }}
          >
            ハガキ代より安く、
            <br className="sm:hidden" />
            関係は一生モノに。
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-center text-sm text-white/55">
            車検整備の利益は1台あたり数万円。月にたった1台、多く逃さなければペイする。
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
              tagline="LINE配信を本気でやる方へ"
              limit="お客様 無制限"
              recommended
              features={[
                'スタンダードのすべて',
                'LINE Messaging API 連携',
                'Liny / Lステップ系 タグ連携',
                'マルチスタッフ（3名まで）',
                '優先サポート',
                '今後の新機能 優先アクセス',
              ]}
            />
          </div>

          <p className="mt-7 text-center text-[11px] tracking-wide text-white/40">
            ✓ 30日無料トライアル　✓ カード登録不要　✓ いつでも解約可能
          </p>
        </div>
      </section>

      {/* ───────── 最終CTA ───────── */}
      <section
        className="relative overflow-hidden px-5 py-24 sm:px-8 lg:py-32"
        style={{ background: RED }}
      >
        <div className="lp-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2
            className="font-bold tracking-tight text-white"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              fontSize: 'clamp(1.7rem, 5.5vw, 3.6rem)',
              lineHeight: 1.08,
            }}
          >
            <span className="inline-block">車検客を逃さない店に、</span>
            <span className="inline-block">なる。</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-white/85">
            登録は3分。クレジットカードは要りません。
            <br />
            まずは30日、全機能を無料でお試しください。
          </p>
          <Link
            href="/signup"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-base font-bold text-black shadow-2xl transition-transform hover:scale-[1.03]"
            style={{ color: '#0a0a0a' }}
          >
            くるまカルテを無料で始める →
          </Link>
        </div>
      </section>

      {/* ───────── 06 FAQ ───────── */}
      <section className="px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <SectionLabel index="06" en="FAQ" jp="よくあるご質問" center />
          <div className="mt-10 space-y-3">
            <Faq
              q="お客様にPCやアプリのダウンロードは必要？"
              a="いいえ。スマホのブラウザだけでOK。お渡しするQRをカメラで撮るだけで、マイページが開きます。"
            />
            <Faq
              q="既に CarRide や他社サービスを使っているのですが…"
              a="他社は業務効率化ツールなので、くるまカルテ（お客様向け体験）と併用できます。役割が違うため、共存が前提です。"
            />
            <Faq
              q="お客様データは安全ですか？"
              a="国内サーバー（Supabase / Vercel）で暗号化保管。各店舗の情報は完全に分離されます。"
            />
            <Faq
              q="既存の Liny / Lステップは活かせますか？"
              a="はい。プロプランでAPI連携可能。くるまカルテは「タグを付ける」役割で、配信文面は今までのシナリオをそのまま使えます。"
            />
            <Faq
              q="お客様への押し付け感が心配です"
              a="マイページは「お客様の愛車のページ」として設計しています。ALWAYS WITH YOU・思い出ギャラリーなど、お客様が見たくなる仕掛けで自然に開いてくれます。"
            />
          </div>
        </div>
      </section>

      {/* ───────── フッター ───────── */}
      <footer
        className="border-t px-5 py-12 sm:px-8"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          background: '#050505',
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-7 w-7 shrink-0" />
            <div>
              <p className="text-sm font-bold">くるまカルテ</p>
              <p className="text-[11px] text-white/45">
                町工場のための、お客様向け愛車マイページSaaS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/55">
            <Link href="/login" className="transition-colors hover:text-white">
              ログイン
            </Link>
            <Link href="/signup" className="transition-colors hover:text-white">
              無料で試す
            </Link>
          </div>
        </div>
        <nav className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-white/45 sm:justify-start">
          <a
            href="https://urakata.biz/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            運営：株式会社UrakaTA
          </a>
          <span aria-hidden className="text-white/20">·</span>
          <a
            href="https://urakata.biz/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            プライバシーポリシー
          </a>
          <span aria-hidden className="text-white/20">·</span>
          <Link
            href="/legal/tokushou"
            className="transition-colors hover:text-white"
          >
            特定商取引法に基づく表記
          </Link>
        </nav>
        <p className="mx-auto mt-4 max-w-6xl text-[10px] text-white/30">
          Powered by Anthropic Claude / Supabase / Vercel · © UrakaTA Inc.
        </p>
      </footer>
    </div>
  )
}

const TICKER = [
  '車検通知 完全自動化',
  'AI 整備提案',
  '車検証 OCR',
  'お客様マイページ',
  'LINE 連携',
  'Before / After',
  'ツーリング記録',
  'ALWAYS WITH YOU',
]

/* ───────── 小コンポーネント ───────── */

function SectionLabel({
  index,
  en,
  jp,
  center = false,
}: {
  index: string
  en: string
  jp: string
  center?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 ${center ? 'justify-center' : ''}`}
    >
      <span
        className="text-xs font-bold tabular-figs"
        style={{ color: RED, fontFamily: 'var(--font-display), sans-serif' }}
      >
        {index}
      </span>
      <span className="h-px w-6" style={{ background: RED }} aria-hidden />
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45"
        style={{ fontFamily: 'var(--font-display), sans-serif' }}
      >
        {en}
      </span>
      <span className="text-[11px] font-medium text-white/35">/ {jp}</span>
    </div>
  )
}

function Pain({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div
      className="group relative rounded-xl border p-6 transition-colors hover:bg-white/[0.03]"
      style={{ borderColor: 'rgba(255,255,255,0.1)' }}
    >
      <span
        className="text-3xl font-black tabular-figs text-white/10"
        style={{ fontFamily: 'var(--font-display), sans-serif' }}
      >
        {n}
      </span>
      <p className="mt-3 text-base font-bold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
    </div>
  )
}

function Feature({
  n,
  icon,
  title,
  body,
}: {
  n: string
  icon: string
  title: string
  body: string
}) {
  return (
    <div
      className="group relative p-7 transition-colors"
      style={{ background: '#0a0a0a' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl transition-transform group-hover:scale-110">
          {icon}
        </span>
        <span
          className="text-xs font-bold tabular-figs text-white/20 transition-colors group-hover:text-[color:var(--theme-primary)]"
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          {n}
        </span>
      </div>
      <p className="mt-5 text-base font-bold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{body}</p>
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
    <div
      className="rounded-xl border p-6 backdrop-blur"
      style={{
        borderColor: 'rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <span className="text-3xl">{icon}</span>
      <p
        className="mt-4 text-sm font-bold uppercase tracking-wide"
        style={{ fontFamily: 'var(--font-display), sans-serif', color: GOLD }}
      >
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{body}</p>
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
      className="relative rounded-2xl border p-7"
      style={{
        borderColor: recommended
          ? 'var(--theme-primary)'
          : 'rgba(255,255,255,0.12)',
        background: recommended ? 'rgba(220,26,26,0.06)' : 'rgba(255,255,255,0.02)',
        boxShadow: recommended
          ? '0 0 40px -12px color-mix(in srgb, var(--theme-primary) 50%, transparent)'
          : 'none',
      }}
    >
      {recommended && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ background: RED }}
        >
          ★ おすすめ
        </span>
      )}
      <h3
        className="text-xl font-bold"
        style={{ fontFamily: 'var(--font-display), sans-serif' }}
      >
        {name}
      </h3>
      <p className="mt-1 text-xs text-white/45">{tagline}</p>
      <p className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-black tabular-figs">
          ¥{price.toLocaleString()}
        </span>
        <span className="text-sm text-white/45">/月（税別）</span>
      </p>
      <p className="mt-1 text-xs text-white/45">{limit}</p>

      <ul className="mt-6 space-y-2.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span style={{ color: recommended ? RED : GOLD }}>✓</span>
            <span className="text-white/80">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className="mt-7 block w-full rounded-full px-4 py-3 text-center text-sm font-bold transition-transform hover:scale-[1.02]"
        style={
          recommended
            ? { background: RED, color: '#fff' }
            : {
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
              }
        }
      >
        このプランで始める
      </Link>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details
      className="group rounded-xl border p-5 transition-colors hover:bg-white/[0.02]"
      style={{ borderColor: 'rgba(255,255,255,0.1)' }}
    >
      <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold">
        <span>
          <span style={{ color: RED }}>Q.</span> {q}
        </span>
        <span
          className="shrink-0 text-lg text-white/40 transition-transform group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-white/65">{a}</p>
    </details>
  )
}
