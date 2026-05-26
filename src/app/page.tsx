import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl space-y-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          くるまカルテ
        </h1>
        <p className="text-lg text-zinc-600">
          車検のお知らせ、まだハガキで出してますか？
          <br />
          お客さんの愛車を、店からもお客さんからも"忘れない"場所へ。
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            無料で試す
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium hover:bg-zinc-50"
          >
            ログイン
          </Link>
        </div>
        <p className="pt-6 text-xs text-zinc-400">
          ※ 開発中の Working Title です（正式サービス名はローンチ前に確定）
        </p>
      </div>
    </div>
  )
}
