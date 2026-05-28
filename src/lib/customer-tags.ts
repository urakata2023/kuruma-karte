/**
 * 顧客タグ定義 (Phase L - C)
 * 「うちの店ではこういう特徴のお客様」を一目で識別するラベル
 */

export type CustomerTagDef = {
  id: string
  label: string
  icon: string
  color: 'red' | 'amber' | 'green' | 'blue' | 'purple' | 'zinc'
  description: string
}

export const CUSTOMER_TAGS: CustomerTagDef[] = [
  {
    id: 'vip',
    label: 'VIP',
    icon: '⭐',
    color: 'amber',
    description: '高単価・長期顧客。優先対応',
  },
  {
    id: 'follow_up',
    label: '要フォロー',
    icon: '🔔',
    color: 'red',
    description: '次回連絡が必要',
  },
  {
    id: 'dormant',
    label: '休眠',
    icon: '😴',
    color: 'zinc',
    description: '半年以上来店なし',
  },
  {
    id: 'new',
    label: '新規',
    icon: '🌱',
    color: 'green',
    description: '登録から3ヶ月以内',
  },
  {
    id: 'regular',
    label: '常連',
    icon: '🤝',
    color: 'blue',
    description: '定期的に来店',
  },
  {
    id: 'careful',
    label: '要注意',
    icon: '⚠️',
    color: 'purple',
    description: 'クレーム歴・要確認',
  },
]

export function getTagDef(id: string): CustomerTagDef | undefined {
  return CUSTOMER_TAGS.find((t) => t.id === id)
}

export const TAG_COLOR_CLASSES: Record<
  CustomerTagDef['color'],
  { bg: string; fg: string; ring: string }
> = {
  red: {
    bg: 'bg-red-100 dark:bg-red-950',
    fg: 'text-red-700 dark:text-red-300',
    ring: 'ring-red-200 dark:ring-red-800',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-950',
    fg: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-800',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-950',
    fg: 'text-green-700 dark:text-green-300',
    ring: 'ring-green-200 dark:ring-green-800',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-950',
    fg: 'text-blue-700 dark:text-blue-300',
    ring: 'ring-blue-200 dark:ring-blue-800',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-950',
    fg: 'text-purple-700 dark:text-purple-300',
    ring: 'ring-purple-200 dark:ring-purple-800',
  },
  zinc: {
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    fg: 'text-zinc-700 dark:text-zinc-300',
    ring: 'ring-zinc-200 dark:ring-zinc-700',
  },
}
