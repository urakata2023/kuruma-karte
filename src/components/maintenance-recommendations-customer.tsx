import type { MaintenanceAdvice } from '@/lib/maintenance-advisor'

/**
 * お客様マイページ向け「次のおすすめ整備」セクション (Phase M+ 刷新版)
 *
 * Linear / Stripe のドキュメントカード風。
 * 新デザイントークンで統一、緊急度バッジを control 風に、
 * 「お店に相談する」CTAをテーマプライマリで強調。
 */
export function MaintenanceRecommendationsCustomer({
  advice,
  shopPhone,
}: {
  advice: MaintenanceAdvice | null
  shopPhone: string | null
}) {
  if (!advice || advice.recommendations.length === 0) {
    return null
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-8">
      <div
        className="overflow-hidden rounded-2xl border shadow-sm"
        style={{
          background: 'var(--surface-1)',
          borderColor: 'var(--hairline)',
        }}
      >
        {/* ヘッダー: テーマ色のアクセントライン + eyebrow + title */}
        <div
          className="relative px-5 py-5"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--theme-accent) 6%, transparent), transparent)',
          }}
        >
          <div
            className="absolute left-0 top-0 h-full w-1"
            style={{ background: 'var(--theme-accent)' }}
            aria-hidden
          />
          <div className="flex items-start gap-3 pl-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p
                className="text-eyebrow"
                style={{ color: 'var(--theme-accent)' }}
              >
                AI Recommendations
              </p>
              <h2
                className="mt-0.5 text-title"
                style={{ color: 'var(--ink)' }}
              >
                次のおすすめ整備
              </h2>
              {advice.customer_summary && (
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: 'var(--ink-muted)' }}
                >
                  {advice.customer_summary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* おすすめ一覧 */}
        <ol className="divide-y" style={{ borderColor: 'var(--hairline)' }}>
          {advice.recommendations.map((rec, i) => (
            <li key={i} className="px-5 py-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{
                    background: 'var(--surface-2)',
                  }}
                >
                  {rec.icon}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className="text-base font-semibold"
                      style={{ color: 'var(--ink)' }}
                    >
                      {rec.title}
                    </h3>
                    <UrgencyBadge
                      urgency={rec.urgency}
                      window={rec.due_window}
                    />
                  </div>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: 'var(--ink-subtle)' }}
                  >
                    {rec.reason}
                  </p>
                  <p
                    className="mt-2.5 text-sm leading-relaxed"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {rec.customer_message}
                  </p>
                  {rec.estimated_cost_range && (
                    <p
                      className="mt-2 inline-flex items-center gap-1.5 text-xs tabular-figs"
                      style={{ color: 'var(--ink-subtle)' }}
                    >
                      <span
                        className="text-eyebrow"
                        style={{ color: 'var(--ink-tertiary)' }}
                      >
                        Est.
                      </span>
                      <span style={{ color: 'var(--ink)' }}>
                        {rec.estimated_cost_range}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* お問い合わせCTA */}
        {shopPhone && (
          <div
            className="border-t px-5 py-4"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <a
              href={`tel:${shopPhone}`}
              className="block w-full rounded-md px-4 py-3 text-center text-sm font-semibold transition-transform active:scale-[0.98]"
              style={{
                background: 'var(--theme-primary)',
                color: 'var(--theme-primary-fg)',
              }}
            >
              📞 お店に相談する
            </a>
            <p
              className="mt-2 text-center text-[10px]"
              style={{ color: 'var(--ink-tertiary)' }}
            >
              AI による提案です。最終的な整備内容は整備士とご相談ください
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function UrgencyBadge({
  urgency,
  window: w,
}: {
  urgency: 'high' | 'medium' | 'low'
  window: string
}) {
  const styles: Record<
    'high' | 'medium' | 'low',
    { bg: string; fg: string; label: string }
  > = {
    high: {
      bg: 'rgb(254 226 226)',
      fg: 'rgb(185 28 28)',
      label: '急ぎ',
    },
    medium: {
      bg: 'rgb(254 243 199)',
      fg: 'rgb(180 83 9)',
      label: 'そろそろ',
    },
    low: {
      bg: 'rgb(220 252 231)',
      fg: 'rgb(21 128 61)',
      label: '余裕',
    },
  }
  const s = styles[urgency]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: s.fg }}
      />
      {s.label}
      {w && ` · ${w}`}
    </span>
  )
}
