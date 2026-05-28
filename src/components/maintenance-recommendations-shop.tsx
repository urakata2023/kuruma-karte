import type { MaintenanceAdvice } from '@/lib/maintenance-advisor'

/**
 * 店主・整備士向けの「AIアシスタント」セクション。
 *
 * お客様向けと違って、ビジネスとして「次に何を売れるか・話せるか」
 * を実務目線で整理する。電話の話題、整備提案のトーク材料。
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
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        AI整備提案を準備中です…（ページを再読み込みすると表示されます）
      </div>
    )
  }

  if (advice.recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-semibold">🤖 AIアシスタント</p>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          {advice.shop_summary || '現時点で特に急ぎの提案はありません。'}
        </p>
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <header className="border-b border-zinc-200 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 dark:border-zinc-800 dark:from-blue-950 dark:to-purple-950">
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <h3 className="text-sm font-semibold">
            AIアシスタント — {customerName} 様への次の一歩
          </h3>
        </div>
        {advice.shop_summary && (
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {advice.shop_summary}
          </p>
        )}
      </header>

      <ol className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {advice.recommendations.map((rec, i) => (
          <li key={i} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="text-xl">{rec.icon}</div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold">{rec.title}</h4>
                  <UrgencyTag urgency={rec.urgency} />
                  {rec.due_window && (
                    <span className="text-[10px] text-zinc-500">
                      ・{rec.due_window}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-500">{rec.reason}</p>
                <div className="mt-2 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    電話の話題に
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {rec.shop_message}
                  </p>
                </div>
                {rec.estimated_cost_range && (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    目安：{rec.estimated_cost_range}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <footer className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-[10px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
        AI 整備提案 ({new Date(advice.generated_at).toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })} 生成)
      </footer>
    </section>
  )
}

function UrgencyTag({ urgency }: { urgency: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    medium:
      'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    low: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  }
  const labels = { high: '急ぎ', medium: 'そろそろ', low: '余裕' }
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${styles[urgency]}`}
    >
      {labels[urgency]}
    </span>
  )
}
