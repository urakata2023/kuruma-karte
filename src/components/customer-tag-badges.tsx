import { CUSTOMER_TAGS, TAG_COLOR_CLASSES, getTagDef } from '@/lib/customer-tags'

/**
 * 顧客タグの読み取り専用バッジ列 (Phase L - C)
 */
export function CustomerTagBadges({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className="inline-flex flex-wrap gap-1.5">
      {tags.map((id) => {
        const def = getTagDef(id)
        if (!def) return null
        const cls = TAG_COLOR_CLASSES[def.color]
        return (
          <span
            key={id}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cls.bg} ${cls.fg}`}
            title={def.description}
          >
            <span>{def.icon}</span>
            <span>{def.label}</span>
          </span>
        )
      })}
    </div>
  )
}

export { CUSTOMER_TAGS }
