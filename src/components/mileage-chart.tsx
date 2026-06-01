import type { MileagePoint } from '@/lib/vehicle-stats'

/**
 * 走行距離の推移を純SVGで描画（ライブラリ不要）。
 * データ点が2個未満なら null を返す。
 *
 * 配色はテーマ変数 (--theme-accent / --ink-*) に連動。折れ線は
 * 単調増加データでもオーバーシュートしない範囲でベジェ平滑化する。
 */
export function MileageChart({ points }: { points: MileagePoint[] }) {
  if (points.length < 2) return null

  const width = 600
  const height = 240
  const padding = { top: 30, right: 28, bottom: 38, left: 64 }

  const minDate = new Date(points[0].date).getTime()
  const maxDate = new Date(points[points.length - 1].date).getTime()
  const minKm = Math.min(...points.map((p) => p.km))
  const maxKm = Math.max(...points.map((p) => p.km))

  const dateRange = maxDate - minDate || 1
  const kmRange = maxKm - minKm || 1

  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const baseY = padding.top + innerH

  const xScale = (dateStr: string) => {
    const t = new Date(dateStr).getTime()
    return padding.left + ((t - minDate) / dateRange) * innerW
  }
  const yScale = (km: number) => {
    return padding.top + (1 - (km - minKm) / kmRange) * innerH
  }

  // 画面座標に変換した点列
  const sp = points.map((p) => ({ x: xScale(p.date), y: yScale(p.km) }))
  const last = sp[sp.length - 1]

  const linePath = buildSmoothPath(sp)
  const areaPath = `${linePath} L ${last.x} ${baseY} L ${sp[0].x} ${baseY} Z`

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full"
        role="img"
        aria-label="走行距離の推移グラフ"
      >
        <defs>
          {/* アクセント色の縦グラデ（折れ線の下を塗る） */}
          <linearGradient id="mileageArea" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              style={{ stopColor: 'var(--theme-accent)', stopOpacity: 0.32 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: 'var(--theme-accent)', stopOpacity: 0 }}
            />
          </linearGradient>
          {/* 折れ線・点のソフトグロー */}
          <filter
            id="mileageGlow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* グリッド・軸・ラベル（ミュート色） */}
        <g style={{ color: 'var(--ink-subtle)' }}>
          {/* 中間ガイドライン */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={padding.left}
              y1={padding.top + innerH * ratio}
              x2={padding.left + innerW}
              y2={padding.top + innerH * ratio}
              stroke="currentColor"
              strokeWidth="1"
              opacity={ratio === 1 ? 0.25 : 0.1}
              strokeDasharray={ratio === 1 ? undefined : '3 4'}
            />
          ))}

          {/* Y軸ラベル（最新=上 / 最古=下） */}
          <text
            x={padding.left - 10}
            y={yScale(maxKm) + 4}
            fontSize="11"
            textAnchor="end"
            fill="currentColor"
            opacity="0.75"
          >
            {maxKm.toLocaleString()} km
          </text>
          <text
            x={padding.left - 10}
            y={yScale(minKm) + 4}
            fontSize="11"
            textAnchor="end"
            fill="currentColor"
            opacity="0.55"
          >
            {minKm.toLocaleString()} km
          </text>

          {/* X軸ラベル（最古・最新） */}
          <text
            x={sp[0].x}
            y={baseY + 20}
            fontSize="11"
            textAnchor="start"
            fill="currentColor"
            opacity="0.6"
          >
            {formatShortDate(points[0].date)}
          </text>
          <text
            x={last.x}
            y={baseY + 20}
            fontSize="11"
            textAnchor="end"
            fill="currentColor"
            opacity="0.6"
          >
            {formatShortDate(points[points.length - 1].date)}
          </text>
        </g>

        {/* 塗りエリア */}
        <path d={areaPath} fill="url(#mileageArea)" stroke="none" />

        {/* グロー下地（ぼかした太線） */}
        <path
          d={linePath}
          fill="none"
          style={{ stroke: 'var(--theme-accent)' }}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.35"
          filter="url(#mileageGlow)"
        />

        {/* 折れ線本体 */}
        <path
          d={linePath}
          fill="none"
          style={{ stroke: 'var(--theme-accent)' }}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 中間データ点（控えめ） */}
        {sp.slice(0, -1).map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3.5"
            style={{ fill: 'var(--canvas)', stroke: 'var(--theme-accent)' }}
            strokeWidth="2"
          />
        ))}

        {/* 最新点（強調：ハロ＋アクセント＋白コア） */}
        <circle
          cx={last.x}
          cy={last.y}
          r="11"
          style={{ fill: 'var(--theme-accent)' }}
          opacity="0.18"
        />
        <circle
          cx={last.x}
          cy={last.y}
          r="6"
          style={{ fill: 'var(--theme-accent)' }}
          filter="url(#mileageGlow)"
        />
        <circle cx={last.x} cy={last.y} r="2.5" fill="#ffffff" />
      </svg>
    </div>
  )
}

/**
 * Catmull-Rom 由来の3次ベジェで点列を平滑化する。
 * 制御点のyは各区間の[最小,最大]にクランプし、単調増加データが
 * 視覚的に減少して見える（オーバーシュート）のを防ぐ。
 */
function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  const d = [`M ${pts[0].x} ${pts[0].y}`]
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    let c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    let c2y = p2.y - (p3.y - p1.y) / 6
    const lo = Math.min(p1.y, p2.y)
    const hi = Math.max(p1.y, p2.y)
    c1y = Math.max(lo, Math.min(hi, c1y))
    c2y = Math.max(lo, Math.min(hi, c2y))
    d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`)
  }
  return d.join(' ')
}

function formatShortDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${y.slice(2)}/${m}/${day}`
}
