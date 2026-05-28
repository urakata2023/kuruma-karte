import type { MaintenanceAdvice } from '@/lib/maintenance-advisor'

/**
 * お客様マイページ向け「次のおすすめ整備」セクション。
 *
 * AI が車種・走行距離・整備履歴から判断したおすすめ整備を、
 * 安心感のあるトーンで提示する。
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
          background: 'var(--theme-surface)',
          borderColor: 'var(--theme-surface-border)',
        }}
      >
        {/* ヘッダー */}
        <div
          className="px-5 py-4"
          style={{
            background:
              'linear-gradient(90deg, var(--theme-accent) 0%, color-mix(in srgb, var(--theme-accent) 70%, var(--theme-primary)) 100%)',
            color: 'var(--theme-accent-fg)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">💡</span>
            <h2 className="text-sm font-semibold tracking-wide">
              AIからの「次のおすすめ整備」
            </h2>
          </div>
          {advice.customer_summary && (
            <p className="mt-1 text-xs opacity-90">
              {advice.customer_summary}
            </p>
          )}
        </div>

        {/* おすすめ一覧 */}
        <ol className="divide-y" style={{ borderColor: 'var(--theme-surface-border)' }}>
          {advice.recommendations.map((rec, i) => (
            <li key={i} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{rec.icon}</div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{rec.title}</h3>
                    <UrgencyBadge urgency={rec.urgency} window={rec.due_window} />
                  </div>
                  <p className="mt-1 text-xs opacity-70">{rec.reason}</p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {rec.customer_message}
                  </p>
                  {rec.estimated_cost_range && (
                    <p className="mt-2 text-xs">
                      <span className="opacity-60">目安費用：</span>
                      <span className="font-medium">{rec.estimated_cost_range}</span>
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
            style={{ borderColor: 'var(--theme-surface-border)' }}
          >
            <a
              href={`tel:${shopPhone}`}
              className="block w-full rounded-md px-4 py-2.5 text-center text-sm font-semibold"
              style={{
                background: 'var(--theme-primary)',
                color: 'var(--theme-primary-fg)',
              }}
            >
              📞 お店に相談する
            </a>
            <p className="mt-2 text-center text-[10px] opacity-50">
              AI による提案です。最終的な整備内容は整備士とご相談ください。
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
    high: { bg: '#dc2626', fg: '#ffffff', label: '🔥 急ぎ' },
    medium: { bg: '#f59e0b', fg: '#ffffff', label: '⏰ そろそろ' },
    low: { bg: '#10b981', fg: '#ffffff', label: '✓ 余裕あり' },
  }
  const s = styles[urgency]
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label} {w && `· ${w}`}
    </span>
  )
}
