/**
 * 整備テンプレート (Phase 12-3)
 *
 * 整備記録の新規入力時に「ワンタップで定型を入れる」用。
 * 整備士の入力時間を10分→30秒に短縮。
 */

export type MaintenanceTemplate = {
  id: string
  label: string // ボタン表示用
  icon: string // 絵文字
  title: string // 整備記録の "整備内容" に入る値
  description: string // 詳細欄
  parts: string // 部品欄
  cost: number | null // 標準工賃 (現場で調整可)
  popular?: boolean // よく使うやつを最初に
}

export const MAINTENANCE_TEMPLATES: MaintenanceTemplate[] = [
  {
    id: 'oil',
    label: 'オイル交換',
    icon: '🛢️',
    title: 'オイル交換',
    description: 'エンジンオイル交換。次回の目安は5,000kmまたは6ヶ月後。',
    parts: 'エンジンオイル ',
    cost: 5500,
    popular: true,
  },
  {
    id: 'oil_filter',
    label: 'オイル + フィルター',
    icon: '🛢️',
    title: 'オイル交換 + オイルフィルター交換',
    description:
      'エンジンオイル & オイルフィルター同時交換。次回オイル交換時は単体でOK。',
    parts: 'エンジンオイル 、オイルフィルター',
    cost: 8800,
    popular: true,
  },
  {
    id: 'tire_change_4',
    label: 'タイヤ4本交換',
    icon: '🛞',
    title: 'タイヤ4本交換',
    description: 'タイヤ4本新品交換。バランス調整・廃タイヤ処分込み。',
    parts: 'タイヤ ×4本（サイズ：）',
    cost: 80000,
  },
  {
    id: 'tire_rotation',
    label: 'タイヤローテーション',
    icon: '🔄',
    title: 'タイヤローテーション',
    description:
      'タイヤ前後入れ替え。空気圧調整含む。摩耗均一化で長持ち化。',
    parts: '',
    cost: 3300,
  },
  {
    id: 'brake_pad',
    label: 'ブレーキパッド交換',
    icon: '🛑',
    title: 'ブレーキパッド交換',
    description:
      'フロントブレーキパッド交換。残量1mm前後でしたので限界手前で交換。',
    parts: 'ブレーキパッド フロント (車種純正同等品)',
    cost: 18000,
  },
  {
    id: 'battery',
    label: 'バッテリー交換',
    icon: '🔋',
    title: 'バッテリー交換',
    description:
      'バッテリー新品交換。古いバッテリーは適切に処分済み。アイドリングストップ非対応車は標準品でOK。',
    parts: 'バッテリー（サイズ：）',
    cost: 22000,
  },
  {
    id: 'aircon_filter',
    label: 'エアコンフィルター交換',
    icon: '❄️',
    title: 'エアコンフィルター交換',
    description: 'エアコンフィルター（キャビンフィルター）交換。',
    parts: 'エアコンフィルター',
    cost: 4400,
  },
  {
    id: 'wiper',
    label: 'ワイパーゴム交換',
    icon: '🌧️',
    title: 'ワイパーゴム交換',
    description: 'フロントワイパーゴム左右交換。リアもセットで交換可能。',
    parts: 'ワイパーゴム フロント運転席、助手席',
    cost: 2200,
  },
  {
    id: 'inspection',
    label: '車検整備（24ヶ月点検）',
    icon: '📋',
    title: '車検整備（24ヶ月法定点検）',
    description:
      '24ヶ月法定点検 + 整備。下回り・ブレーキ・足回り・補機類の総合点検。',
    parts: '',
    cost: 70000,
    popular: true,
  },
  {
    id: 'inspection_12',
    label: '12ヶ月点検',
    icon: '✅',
    title: '12ヶ月法定点検',
    description: '12ヶ月法定点検。法定項目を実施しました。',
    parts: '',
    cost: 15000,
  },
  {
    id: 'coolant',
    label: 'クーラント交換',
    icon: '💧',
    title: 'クーラント (LLC) 交換',
    description:
      'ラジエーター冷却水交換。次回交換目安は2〜4年後または車検時。',
    parts: 'スーパーLLC',
    cost: 6600,
  },
  {
    id: 'brake_fluid',
    label: 'ブレーキフルード交換',
    icon: '🛠️',
    title: 'ブレーキフルード交換',
    description: 'ブレーキフルード交換。2年毎または車検時の定期交換。',
    parts: 'DOT3 / DOT4 ブレーキフルード',
    cost: 4400,
  },
  {
    id: 'inspection_only',
    label: 'メモのみ（テンプレなし）',
    icon: '📝',
    title: '',
    description: '',
    parts: '',
    cost: null,
  },
]
