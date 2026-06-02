import Link from 'next/link'

const RED = 'var(--theme-primary)'
const GOLD = 'var(--theme-accent)'

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <div
      data-theme="rosso"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-5 py-12"
      style={{ background: '#070707', color: 'var(--ink)' }}
    >
      {/* 背景テクスチャ */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="lp-grid absolute inset-0 opacity-60" />
        <div
          className="lp-glow absolute left-1/2 top-[-10%] h-[480px] w-[480px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{
            background:
              'radial-gradient(circle, rgba(220,26,26,0.22), transparent 70%)',
          }}
        />
      </div>

      <div
        className="relative z-10 w-full max-w-md rounded-[2rem] p-1.5"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          animation: 'lp-rise 0.8s cubic-bezier(0.32,0.72,0,1) both',
        }}
      >
        <div
          className="rounded-[calc(2rem-0.375rem)] px-7 py-10 text-center sm:px-10"
          style={{
            background: 'linear-gradient(180deg, #101010 0%, #0b0b0b 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl"
            style={{
              background: 'rgba(241,197,87,0.1)',
              border: '1px solid rgba(241,197,87,0.3)',
            }}
          >
            ✉️
          </div>

          <span
            className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: GOLD, fontFamily: 'var(--font-display), sans-serif' }}
          >
            CHECK YOUR INBOX
          </span>
          <h1
            className="mt-3 text-2xl font-bold tracking-tight text-white"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            確認メールを送りました
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-white/55">
            {email ? (
              <>
                <span className="font-semibold text-white">{email}</span> 宛に
                確認メールを送信しました。
              </>
            ) : (
              <>ご登録のメールアドレス宛に確認メールを送信しました。</>
            )}
            <br />
            メール内のリンクを開くと登録が完了します。
          </p>

          <div
            className="mt-6 rounded-xl px-4 py-3 text-left text-xs leading-relaxed text-white/45"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            メールが届かない場合は、迷惑メールフォルダをご確認ください。数分待っても
            届かないときは、お手数ですが再度ご登録ください。
          </div>

          <Link
            href="/login"
            className="group mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: RED }}
          >
            ログインへ進む
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-base transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
