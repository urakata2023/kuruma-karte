import { createAdminClient } from '@/lib/supabase/admin'
import { SignupForm } from './form'
import { BrandMark } from '@/components/brand-mark'

const RED = 'var(--theme-primary)'
const GOLD = 'var(--theme-accent)'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
  const { invite } = await searchParams

  let invitation: {
    shop_name: string
    role: 'owner' | 'staff'
  } | null = null

  if (invite) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('shop_invitations')
      .select('shop_id, role, expires_at, used_at, shops(name)')
      .eq('invitation_code', invite)
      .maybeSingle<{
        shop_id: string
        role: 'owner' | 'staff'
        expires_at: string
        used_at: string | null
        shops: { name: string } | null
      }>()

    if (
      data &&
      !data.used_at &&
      new Date(data.expires_at) > new Date() &&
      data.shops
    ) {
      invitation = {
        shop_name: data.shops.name,
        role: data.role,
      }
    }
  }

  const trust = ['カード登録不要', '30日間 無料', 'いつでも解約可能']

  return (
    <div
      data-theme="rosso"
      className="relative flex min-h-[100dvh] flex-col overflow-hidden md:flex-row"
      style={{ background: '#070707', color: 'var(--ink)' }}
    >
      {/* ── 背景テクスチャ（ブループリント＋レッドグロー） ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="lp-grid absolute inset-0 opacity-60" />
        <div
          className="lp-glow absolute -left-32 top-[-10%] h-[480px] w-[480px] rounded-full blur-[120px]"
          style={{
            background:
              'radial-gradient(circle, rgba(220,26,26,0.28), transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] h-[420px] w-[420px] rounded-full blur-[130px]"
          style={{
            background:
              'radial-gradient(circle, rgba(241,197,87,0.10), transparent 70%)',
          }}
        />
      </div>

      {/* ── 左：エディトリアル・パネル ── */}
      <aside className="relative z-10 flex flex-col justify-between px-6 pb-6 pt-10 md:w-[46%] md:px-12 md:py-14 lg:px-16">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 shrink-0 shadow-lg" />
          <span className="text-sm font-bold tracking-wide">くるまカルテ</span>
        </div>

        <div
          className="mt-10 max-w-md md:mt-0"
          style={{ animation: 'lp-rise 0.7s cubic-bezier(0.32,0.72,0,1) both' }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.28em]"
            style={{
              color: GOLD,
              fontFamily: 'var(--font-display), sans-serif',
            }}
          >
            {invitation ? 'JOIN THE TEAM' : 'START — 30 DAYS FREE'}
          </span>
          <h1
            className="mt-5 text-[2.6rem] font-bold leading-[1.04] tracking-tight md:text-[3.1rem]"
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            {invitation ? (
              <>
                チームに、
                <br />
                ようこそ。
              </>
            ) : (
              <>
                今日から、
                <br />
                <span style={{ color: RED }}>忘れられない店</span>へ。
              </>
            )}
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">
            {invitation
              ? 'アカウントを作って、お店の車両・整備の記録に参加しましょう。'
              : 'お客様のスマホに常駐する、あなたの店専用の愛車マイページ。車検も整備も思い出も、ぜんぶそこに。'}
          </p>

          {!invitation && (
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {trust.map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-1.5 text-xs font-medium text-white/65"
                >
                  <span style={{ color: GOLD }}>✓</span>
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-10 hidden text-[10px] uppercase tracking-[0.3em] text-white/25 md:block">
          ALWAYS WITH YOU
        </p>
      </aside>

      {/* ── 右：フォームカード（Double-Bezel） ── */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-12 pt-2 md:py-14 md:pr-12 lg:pr-16">
        <div
          className="w-full max-w-md rounded-[2rem] p-1.5"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'lp-rise 0.8s cubic-bezier(0.32,0.72,0,1) 0.08s both',
          }}
        >
          <div
            className="rounded-[calc(2rem-0.375rem)] px-6 py-8 sm:px-9 sm:py-10"
            style={{
              background: 'linear-gradient(180deg, #101010 0%, #0b0b0b 100%)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.06)',
            }}
          >
            <div className="mb-7">
              <h2 className="text-lg font-bold tracking-tight text-white">
                {invitation
                  ? `${invitation.shop_name} に参加`
                  : '店舗を登録する'}
              </h2>
              <p className="mt-1 text-xs text-white/45">
                {invitation
                  ? `${invitation.role === 'owner' ? 'オーナー' : 'スタッフ'}として参加します`
                  : '3分で完了。すぐに使いはじめられます。'}
              </p>
            </div>

            <SignupForm
              inviteCode={invite ?? null}
              shopName={invitation?.shop_name ?? null}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
