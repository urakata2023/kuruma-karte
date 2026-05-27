import { getCurrentShop } from '@/lib/shop'
import { generateQrSvg } from '@/lib/qr'
import { PrintButton } from './print-button'

/**
 * 当日配布用 A4チラシ (Phase A-2)
 *
 * ブラウザで開いて Ctrl/Cmd + P で印刷。専用CSS @media print で
 * ヘッダー・ボタンを非表示にし、印刷時はA4 1枚にぴったり収まるようにレイアウト。
 *
 * 内容：
 * - 店舗名
 * - キャッチコピー「あなたの愛車に、ずっと寄り添うマイページを。」
 * - QRコード (大)
 * - 「カメラで読み取って登録するだけ」案内
 * - 主な機能 (車検通知・整備記録・思い出ギャラリー・ALWAYS WITH YOU)
 */
export const metadata = {
  title: '登録用チラシ — くるまカルテ',
}

export default async function FlyerPage() {
  const { shop } = await getCurrentShop()
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://kuruma-karte.vercel.app'
  const url = `${appUrl}/r/${shop.registration_token}`
  const qrSvg = await generateQrSvg(url)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 print:p-0">
      {/* 印刷時には消える操作バー */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <p className="text-xs text-zinc-500">配布用</p>
          <h1 className="text-xl font-semibold">📄 登録用チラシ (A4)</h1>
          <p className="mt-1 text-xs text-zinc-500">
            ブラウザの印刷から「A4・縦・余白なし」で出力すると最適です。
          </p>
        </div>
        <PrintButton />
      </div>

      {/* チラシ本体 */}
      <div
        className="mx-auto aspect-[210/297] w-full overflow-hidden border border-zinc-200 bg-white shadow-md print:border-0 print:shadow-none"
        style={{
          // A4 比率を維持
          background:
            'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
          color: '#171717',
        }}
      >
        <div className="flex h-full flex-col p-10 print:p-12">
          {/* ヘッダー */}
          <header className="border-b-2 border-black pb-4">
            <p className="text-xs tracking-[0.3em] text-zinc-500">FOR OUR CUSTOMERS</p>
            <p className="mt-2 text-2xl font-bold">{shop.name}</p>
          </header>

          {/* 主要メッセージ */}
          <section className="mt-8 text-center">
            <h2 className="text-4xl font-bold leading-tight">
              あなたの愛車に、
              <br />
              ずっと寄り添うマイページを。
            </h2>
            <p className="mt-3 text-sm text-zinc-600">
              車検時期も、整備記録も、ツーリングの思い出も、ぜんぶスマホで。
            </p>
          </section>

          {/* QR + 説明 */}
          <section className="mt-8 flex flex-1 items-center justify-center gap-8">
            <div className="flex-shrink-0">
              <div
                className="rounded-xl border-4 border-black p-2"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <p className="mt-2 text-center text-[10px] text-zinc-500">
                QRを読み取って登録
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="text-sm font-bold">カメラで読み取るだけ</p>
                  <p className="text-xs text-zinc-600">スマホで上のQRを撮るだけで開きます</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-2xl">📸</span>
                <div>
                  <p className="text-sm font-bold">車検証の写真でAI自動入力</p>
                  <p className="text-xs text-zinc-600">面倒な入力はAIが代わりにやります</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-2xl">🔔</span>
                <div>
                  <p className="text-sm font-bold">車検時期を自動でお知らせ</p>
                  <p className="text-xs text-zinc-600">3ヶ月前から自動でメッセージが届きます</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-2xl">⏱️</span>
                <div>
                  <p className="text-sm font-bold">愛車との時間を可視化</p>
                  <p className="text-xs text-zinc-600">ALWAYS WITH YOU で永遠の絆を刻む</p>
                </div>
              </div>
            </div>
          </section>

          {/* フッター：URL */}
          <footer className="mt-6 border-t border-zinc-300 pt-4 text-center">
            <p className="text-[10px] text-zinc-500">
              QRが読めない場合は以下のURLへ
            </p>
            <p
              className="mt-1 break-all font-mono text-xs"
              style={{ wordBreak: 'break-all' }}
            >
              {url}
            </p>
            <p className="mt-4 text-[10px] tracking-widest text-zinc-400">
              Powered by くるまカルテ
            </p>
          </footer>
        </div>
      </div>
    </main>
  )
}
