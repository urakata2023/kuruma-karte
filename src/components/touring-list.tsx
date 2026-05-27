import Link from 'next/link'
import { ConfirmDeleteForm } from '@/components/confirm-delete-form'
import {
  deleteTouringRecord,
  refreshTouringCoordinates,
} from '@/app/my/[token]/touring/actions'
import type { TouringRecord } from '@/lib/types'

export function TouringList({
  records,
  token,
}: {
  records: TouringRecord[]
  token: string
}) {
  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
        まだツーリングの記録はありません
        <br />
        愛車と行った場所の思い出を残しましょう
      </div>
    )
  }

  // 日付降順
  const sorted = [...records].sort((a, b) => {
    const d = a.touring_date.localeCompare(b.touring_date)
    if (d !== 0) return -d
    return -a.created_at.localeCompare(b.created_at)
  })

  return (
    <ul className="space-y-4">
      {sorted.map((r) => {
        const hasCoords = r.latitude != null && r.longitude != null
        const hasPlaceOrAddress = !!(r.place_name || r.address)
        return (
          <li
            key={r.id}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black"
          >
            {r.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.photo_url}
                alt={r.title}
                className="block aspect-[16/10] w-full object-cover"
              />
            )}
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold">🛣️ {r.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatDateJP(r.touring_date)}
                    {r.place_name && ` · ${r.place_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap text-xs">
                  <Link
                    href={`/my/${token}/touring/${r.id}/edit`}
                    className="font-medium underline"
                  >
                    編集
                  </Link>
                  <ConfirmDeleteForm
                    action={deleteTouringRecord.bind(null, token, r.id)}
                    label={`${r.title}(${formatDateJP(r.touring_date)})`}
                    className="text-xs font-medium text-red-600 hover:underline"
                  />
                </div>
              </div>
              {r.address && (
                <p className="text-xs text-zinc-500">📍 {r.address}</p>
              )}
              {r.memo && (
                <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {r.memo}
                </p>
              )}

              {/* マップリンク or 座標取得ボタン */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {hasCoords && (
                  <a
                    href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-blue-600 underline dark:text-blue-400"
                  >
                    🗺️ Googleマップで開く
                  </a>
                )}
                {!hasCoords && hasPlaceOrAddress && (
                  <form
                    action={refreshTouringCoordinates.bind(null, token, r.id)}
                  >
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
                      📍 この場所をマップに追加
                    </button>
                  </form>
                )}
                {!hasCoords && !hasPlaceOrAddress && (
                  <p className="text-xs text-zinc-400">
                    （住所か場所の名前を入れると地図に追加できます）
                  </p>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function formatDateJP(d: string): string {
  const [y, m, day] = d.split('-')
  return `${y}年${m}月${day}日`
}
