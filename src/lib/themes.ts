/**
 * 店舗テーマプリセット (Phase 10)
 *
 * data-theme 属性に theme.id を付与すると globals.css で定義した CSS Variables が切り替わる。
 *
 * 注意: ブランド名 (Ferrari/Porsche/BMW/Lexus等) は商標問題があるため使用しない。
 *      テーマ名は配色のイメージから抽象化したオリジナル名で運用する。
 */

export type ThemeId =
  | 'default'
  | 'rosso'
  | 'heritage-gold'
  | 'bavarian-blue'
  | 'premium-black'
  | 'silver-star'

export type ThemePreset = {
  id: ThemeId
  name: string // 表示名
  tagline: string // 一言キャッチ
  /** プレビュー用の代表色 (Tailwind hex) */
  preview: {
    bg: string
    primary: string
    accent: string
    text: string
  }
}

export const THEMES: ThemePreset[] = [
  {
    id: 'default',
    name: 'Karte Default',
    tagline: 'シンプル・モダン（標準）',
    preview: {
      bg: '#ffffff',
      primary: '#18181b',
      accent: '#2563eb',
      text: '#18181b',
    },
  },
  {
    id: 'rosso',
    name: 'Rosso',
    tagline: '情熱の赤×黒（イタリアンスポーツ風）',
    preview: {
      bg: '#0a0a0a',
      primary: '#dc1a1a',
      accent: '#f1c557',
      text: '#fafafa',
    },
  },
  {
    id: 'heritage-gold',
    name: 'Heritage Gold',
    tagline: 'クリーム×ボルドー×ゴールド（ヘリテージ）',
    preview: {
      bg: '#f7f1e3',
      primary: '#7a1f1f',
      accent: '#c79a3a',
      text: '#2a1a0e',
    },
  },
  {
    id: 'bavarian-blue',
    name: 'Bavarian Blue',
    tagline: '白×青の機能美（ジャーマンプレシジョン）',
    preview: {
      bg: '#ffffff',
      primary: '#0a4ea3',
      accent: '#1c79e0',
      text: '#0f1f33',
    },
  },
  {
    id: 'premium-black',
    name: 'Premium Black',
    tagline: '漆黒×シャンパンゴールド（ラグジュアリー）',
    preview: {
      bg: '#0f0f0f',
      primary: '#0a0a0a',
      accent: '#c9a86a',
      text: '#f5f0e3',
    },
  },
  {
    id: 'silver-star',
    name: 'Silver Star',
    tagline: 'シルバー×紺の格式（プレステージ）',
    preview: {
      bg: '#f4f6f9',
      primary: '#0c1a2b',
      accent: '#7d8b9c',
      text: '#0c1a2b',
    },
  },
]

const ALLOWED_THEME_IDS = new Set(THEMES.map((t) => t.id))

export function isValidTheme(id: unknown): id is ThemeId {
  return typeof id === 'string' && ALLOWED_THEME_IDS.has(id as ThemeId)
}

export function getTheme(id: string | null | undefined): ThemePreset {
  if (id && isValidTheme(id)) {
    return THEMES.find((t) => t.id === id)!
  }
  return THEMES[0] // default
}
