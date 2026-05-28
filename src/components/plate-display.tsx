'use client'

import { useState } from 'react'

/**
 * 日本の自動車ナンバープレートを物理的に再現するコンポーネント。
 *
 * 構造:
 *   ┌──────────────────┐
 *   │   川口  300       │ ← 上段: 地名 + 分類番号 (小)
 *   │   ━━━━━━━━━━     │
 *   │  ち  6 1 - 7 5    │ ← 下段: ひらがな + 一連番号 (大)
 *   └──────────────────┘
 *
 * 入力例: "川口 300 ち 6175" / "品川 500 さ 12-34" / "川口 300 ち 12-34"
 *
 * 自家用乗用車 = 白地に緑文字
 * 軽自動車    = 黄地に黒文字 (今は plate に「軽」など判定材料がないので白地固定)
 */
export function PlateDisplay({
  plate,
  className = '',
  defaultHidden = false,
}: {
  plate: string
  className?: string
  defaultHidden?: boolean
}) {
  const [hidden, setHidden] = useState(defaultHidden)
  const parsed = parsePlate(plate)

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <PlatePhysical
        region={parsed.region}
        category={parsed.category}
        hira={parsed.hira}
        serial={parsed.serial}
        hidden={hidden}
      />
      <button
        type="button"
        onClick={() => setHidden(!hidden)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors"
        style={{
          background:
            'color-mix(in srgb, var(--ink) 8%, transparent)',
          color: 'var(--ink-subtle)',
        }}
        aria-label={hidden ? 'ナンバーを表示' : 'ナンバーを隠す'}
        title={
          hidden
            ? 'タップして表示'
            : 'タップして隠す（SNS共有時のプライバシー保護に）'
        }
      >
        {hidden ? '🙈' : '👁'}
      </button>
    </span>
  )
}

/**
 * 物理ナンバープレート風 UI
 *  - 白地に深緑文字（自家用乗用）
 *  - 角丸ごく薄め
 *  - 上段に地名+分類番号、下段にひらがな+一連番号
 *  - 一連番号 4桁は中央に `-` を入れる
 */
function PlatePhysical({
  region,
  category,
  hira,
  serial,
  hidden,
}: {
  region: string
  category: string
  hira: string
  serial: string
  hidden: boolean
}) {
  const plateText = '#1f4d2e' // 深緑 (自家用乗用車)
  const plateBg = '#f5f5ef' // 淡いオフホワイト (本物に近い色)
  const plateBorder = '#1f4d2e'

  // 一連番号を表示形式に: "1234" → "12-34", "123" → "・123", "12" → "・・12"
  const serialDisplay = formatSerial(serial)

  return (
    <span
      className="inline-flex flex-col items-center rounded-[3px] border-[2px] shadow-sm"
      style={{
        background: plateBg,
        borderColor: plateBorder,
        color: plateText,
        padding: '2px 9px 3px',
        minWidth: '128px',
        fontFeatureSettings: '"tnum"',
      }}
    >
      {/* 上段: 地名 + 分類番号 */}
      <span
        className="flex w-full items-baseline justify-center gap-2 leading-none"
        style={{
          fontFamily:
            '"Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", sans-serif',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          {hidden ? maskKanji(region) : region}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hidden ? '●●●' : category}
        </span>
      </span>

      {/* 区切り線 */}
      <span
        aria-hidden
        style={{
          display: 'block',
          width: '92%',
          height: '1px',
          background: 'color-mix(in srgb, currentColor 18%, transparent)',
          marginTop: '2px',
          marginBottom: '2px',
        }}
      />

      {/* 下段: ひらがな + 一連番号 */}
      <span className="flex w-full items-baseline justify-center gap-1.5 leading-none">
        <span
          style={{
            fontFamily:
              '"Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", sans-serif',
            fontSize: '15px',
            fontWeight: 700,
          }}
        >
          {hidden ? '●' : hira}
        </span>
        <span
          style={{
            fontFamily:
              '"SF Mono", "JetBrains Mono", "Geist Mono", monospace',
            fontSize: '21px',
            fontWeight: 800,
            letterSpacing: '0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hidden ? '●●-●●' : serialDisplay}
        </span>
      </span>
    </span>
  )
}

/**
 * "川口 300 ち 6175" のような自由文を 4要素にパースする。
 * 失敗時は plate 全体を region に格納してフォールバック。
 */
function parsePlate(plate: string): {
  region: string
  category: string
  hira: string
  serial: string
} {
  const cleaned = plate.replace(/[\s　]+/g, ' ').trim()
  // 例: "川口 300 ち 6175" or "品川 300 あ 12-34"
  const match = cleaned.match(
    /^([一-龥]{1,5})\s*(\d{1,3})\s*([あ-んア-ンA-Z])\s*([\d\s\-・]+)$/
  )
  if (match) {
    return {
      region: match[1],
      category: match[2],
      hira: match[3],
      serial: match[4].replace(/[\s\-・]/g, ''),
    }
  }
  // パース不可ならとりあえず region に丸ごと入れて他は空に
  return { region: cleaned, category: '', hira: '', serial: '' }
}

/**
 * 一連番号: "1234" → "12-34", "123" → "・123", "12" → "・・12", "5" → "・・・5"
 * 本物のプレートに準拠
 */
function formatSerial(serial: string): string {
  const digits = serial.replace(/\D/g, '')
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`
  }
  if (digits.length === 3) return `・${digits}`
  if (digits.length === 2) return `・・${digits}`
  if (digits.length === 1) return `・・・${digits}`
  return digits || '・・・・'
}

/**
 * 地名（漢字）を ● でマスク（プライバシー保護モード時）
 */
function maskKanji(s: string): string {
  return s.replace(/./g, '●')
}
