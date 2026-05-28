/**
 * 予約の時間帯定義 (Phase G 改修)
 *
 * 旧: 'morning' / 'afternoon' / 'evening' / 'any' の4区分
 * 新: 9:00〜18:00 の1時間刻み + 'any' (お任せ)
 *
 * DBには文字列で保存 ('09:00', '10:00', ..., '18:00', 'any')。
 * 旧データ ('morning' / 'afternoon' / 'evening') は表示時にフォールバック対応。
 */

export const RESERVATION_SLOTS: { value: string; label: string }[] = [
  { value: '09:00', label: '9:00〜' },
  { value: '10:00', label: '10:00〜' },
  { value: '11:00', label: '11:00〜' },
  { value: '12:00', label: '12:00〜' },
  { value: '13:00', label: '13:00〜' },
  { value: '14:00', label: '14:00〜' },
  { value: '15:00', label: '15:00〜' },
  { value: '16:00', label: '16:00〜' },
  { value: '17:00', label: '17:00〜' },
  { value: '18:00', label: '18:00〜' },
  { value: 'any', label: 'お任せ' },
]

const SLOT_VALUES = new Set(RESERVATION_SLOTS.map((s) => s.value))

/**
 * 文字列 → slot 値に正規化 (受信側で安全に処理)
 */
export function parseSlotValue(v: unknown): string {
  if (typeof v === 'string' && SLOT_VALUES.has(v)) return v
  // 旧データ互換
  if (v === 'morning' || v === 'afternoon' || v === 'evening') return v
  return 'any'
}

/**
 * slot 値 → 表示用ラベル
 */
export function slotLabel(v: string | null | undefined): string {
  if (!v) return 'お任せ'
  // 新しい時刻ベース
  if (v.match(/^\d{2}:\d{2}$/)) return `${v}〜`
  // 旧データ互換
  if (v === 'morning') return '午前'
  if (v === 'afternoon') return '午後'
  if (v === 'evening') return '夕方'
  if (v === 'any') return 'お任せ'
  return v
}
