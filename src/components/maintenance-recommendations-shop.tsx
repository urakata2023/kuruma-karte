import type { MaintenanceAdvice } from '@/lib/maintenance-advisor'
import { formatDateTimeJST } from '@/lib/datetime-jp'

/**
 * 店主・整備士向けの「AIアシスタント」セクション (Phase M+ 刷新版)
 *
 * Linear のドキュメントカード × Stripe のデータ密度。
 * 「電話の話題に」を控えめなアクセントラインで強調。
 */
export function MaintenanceRecommendationsShop({
  advice,
  customerName,
}: {
  advice: MaintenanceAdvice | null
  customerName: string
}) {
  if (!advice) {
    return (
      <div
        className="rounded-xl border border-dashed px-4 py-6 text-center text-xs"
        style={{
          borderColor: 'var(--hairline)',
          background: 'var(--surface-2)',
          color: 'var(--ink-subtle)',
        }}
      >
        AI整備提案を準備中です…（ページを再読み込みすると表示されます）
      </div>
    )
  }

  if (advice.recommendations.length === 0) {
    return (
      <div
        className="rounded-xl border px-4 py-5"
        style={{
          borderColor: 'var(--hairline)',
          background: 'var(--surface-1)',
        }}
      >
        <p className="flex items-center gap-2 font-semibold" style={{ color: 'var(--ink)' }}>
          <span>🤖</span> AIアシスタント
        </p>
        <p
          className="mt-1 text-xs"
          style={{ color: 'var(--ink-subtle)' }}
        >
          {advice.shop_summary || '現時点で特に急ぎの提案はありません。'}
        </p>
      </div>
    )
  }

  return (
    <section
      className="overflow-hidden rounded-xl border"
      style={{
        background: 'var(--surface-1)',
        borderColor: 'var(--hairline)',
      }}
    >
      <header
        className="relative border-b px-5 py-4"
        style={{
          borderColor: 'var(--hairline)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--theme-accent) 5%, transparent), transparent)',
        }}
      >
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ background: 'var(--theme-accent)' }}
          aria-hidden
        />
        <div className="flex items-start gap-3 pl-3">
          <span className="text-xl">🤖</span>
          <div className="flex-1">
            <p
              className="text-eyebrow"
              style={{ color: 'var(--theme-accent)' }}
            >
              AI Assistant
            </p>
            <h3
              className="mt-0.5 text-sm font-semibold"
              style={{ color: 'var(--ink)' }}
            >
              {customerName} 様への次の一歩
            </h3>
            {advice.shop_summary && (
              <p
                className="mt-1.5 text-xs leading-relaxed"
                style={{ color: 'var(--ink-muted)' }}
              >
                {advice.shop_summary}
              </p>
            )}
          </div>
        </div>
      </header>

      <ol className="divide-y" style={{ borderColor: 'var(--hairline)' }}>
        {advice.recommendations.map((rec, i) => (
          <li key={i} className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-lg"
                style={{ background: 'var(--surface-2)' }}
              >
                {rec.icon}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className="text-sm font-semibold"
                    style={{ color: 'var(--ink)' }}
                  >
                    {rec.title}
                  </h4>
                  <UrgencyTag urgency={rec.urgency} />
                  {rec.due_window && (
                    <span
                      className="text-[10px]"
                      style={{ color: 'var(--ink-subtle)' }}
                    >
                      · {rec.due_window}
                    </span>
                  )}
                </div>
                <p
                  className="mt-1 text-xs"
                  style={{ color: 'var(--ink-subtle)' }}
                >
                  {rec.reason}
                </p>

                {/* 電話の話題に: 左にテーマ色アクセントライン */}
                <div
                  className="mt-2.5 rounded-md px-3 py-2.5"
                  style={{
                    background: 'var(--surface-2)',
                    borderLeft: '2px solid var(--theme-accent)',
                  }}
                >
                  <p
                    className="text-eyebrow"
                    style={{ color: 'var(--ink-tertiary)' }}
                  >
                    📞 電話の話題に
                  </p>
                  <p
                    className="mt-1 text-xs leading-relaxed"
                    style={{ color: 'var(--ink-muted)' }}
                  >
                    {rec.shop_message}
                  </p>
                </div>

                {rec.estimated_cost_range && (
                  <p
                    className="mt-2 text-[11px] tabular-figs"
                    style={{ color: 'var(--ink-subtle)' }}
                  >
                    <span
                      className="text-eyebrow"
                      style={{ color: 'var(--ink-tertiary)' }}
                    >
                      Est.
                    </span>{' '}
                    {rec.estimated_cost_range}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <footer
        className="border-t px-5 py-2 text-[10px] tabular-figs"
        style={{
          borderColor: 'var(--hairline)',
          background: 'var(--surface-2)',
          color: 'var(--ink-tertiary)',
        }}
      >
        AI 整備提案 · {formatDateTimeJST(advice.generated_at)} 生成
      </footer>
    </section>
  )
}

function UrgencyTag({ urgency }: { urgency: 'high' | 'medium' | 'low' }) {
  const styles: Record<
    'high' | 'medium' | 'low',
    { bg: string; fg: string; dot: string; label: string }
  > = {
    high: {
      bg: 'rgb(254 226 226)',
      fg: 'rgb(185 28 28)',
      dot: 'rgb(220 38 38)',
      label: '急ぎ',
    },
    medium: {
      bg: 'rgb(254 243 199)',
      fg: 'rgb(180 83 9)',
      dot: 'rgb(217 119 6)',
      label: 'そろそろ',
    },
    low: {
      bg: 'rgb(220 252 231)',
      fg: 'rgb(21 128 61)',
      dot: 'rgb(34 197 94)',
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
        style={{ background: s.dot }}
      />
      {s.label}
    </span>
  )
}
