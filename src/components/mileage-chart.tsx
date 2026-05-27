import type { MileagePoint } from '@/lib/vehicle-stats'

/**
 * 走行距離の推移を純SVGで描画（ライブラリ不要）。
 * データ点が2個未満なら null を返す。
 */
export function MileageChart({ points }: { points: MileagePoint[] }) {
  if (points.length < 2) return null

  const width = 600
  const height = 220
  const padding = { top: 24, right: 24, bottom: 36, left: 64 }

  const minDate = new Date(points[0].date).getTime()
  const maxDate = new Date(points[points.length - 1].date).getTime()
  const minKm = Math.min(...points.map((p) => p.km))
  const maxKm = Math.max(...points.map((p) => p.km))

  const dateRange = maxDate - minDate || 1
  const kmRange = maxKm - minKm || 1

  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const xScale = (dateStr: string) => {
    const t = new Date(dateStr).getTime()
    return padding.left + ((t - minDate) / dateRange) * innerW
  }
  const yScale = (km: number) => {
    return padding.top + (1 - (km - minKm) / kmRange) * innerH
  }

  const pathD = points
    .map(
      (p, i) =>
        (i === 0 ? 'M' : 'L') + ' ' + xScale(p.date) + ' ' + yScale(p.km)
    )
    .join(' ')

  // 塗りつぶしエリア用のパス（折れ線の下を薄く塗る）
  const areaD =
    `M ${xScale(points[0].date)} ${padding.top + innerH} ` +
    points.map((p) => `L ${xScale(p.date)} ${yScale(p.km)}`).join(' ') +
    ` L ${xScale(points[points.length - 1].date)} ${padding.top + innerH} Z`

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full text-zinc-900 dark:text-zinc-100"
        role="img"
        aria-label="走行距離の推移グラフ"
      >
        {/* 補助線 */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerH}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.2"
        />
        <line
          x1={padding.left}
          y1={padding.top + innerH}
          x2={padding.left + innerW}
          y2={padding.top + innerH}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.2"
        />

        {/* 中間ガイドライン */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + innerH * ratio}
            x2={padding.left + innerW}
            y2={padding.top + innerH * ratio}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.08"
            strokeDasharray="3 3"
          />
        ))}

        {/* Y軸ラベル */}
        <text
          x={padding.left - 8}
          y={yScale(maxKm) + 4}
          fontSize="10"
          textAnchor="end"
          fill="currentColor"
          opacity="0.6"
        >
          {maxKm.toLocaleString()} km
        </text>
        <text
          x={padding.left - 8}
          y={yScale(minKm) + 4}
          fontSize="10"
          textAnchor="end"
          fill="currentColor"
          opacity="0.6"
        >
          {minKm.toLocaleString()} km
        </text>

        {/* X軸ラベル（最古・最新） */}
        <text
          x={xScale(points[0].date)}
          y={padding.top + innerH + 18}
          fontSize="10"
          textAnchor="start"
          fill="currentColor"
          opacity="0.6"
        >
          {formatShortDate(points[0].date)}
        </text>
        <text
          x={xScale(points[points.length - 1].date)}
          y={padding.top + innerH + 18}
          fontSize="10"
          textAnchor="end"
          fill="currentColor"
          opacity="0.6"
        >
          {formatShortDate(points[points.length - 1].date)}
        </text>

        {/* 塗りエリア */}
        <path d={areaD} fill="currentColor" opacity="0.08" />

        {/* 折れ線 */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* データ点 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xScale(p.date)}
            cy={yScale(p.km)}
            r="4"
            fill="currentColor"
          />
        ))}
      </svg>
    </div>
  )
}

function formatShortDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${y.slice(2)}/${m}/${day}`
}
