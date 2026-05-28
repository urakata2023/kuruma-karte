'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ConfirmDeleteForm } from '@/components/confirm-delete-form'
import { deleteOwnerMaintenanceRecord } from '@/app/my/[token]/maintenance/actions'
import type { MaintenanceRecord } from '@/lib/types'

type FilterValue = 'all' | 'shop' | 'customer'
type SortValue = 'newest' | 'oldest'

/**
 * お客様マイページのタイムライン表示。
 * フィルタ（すべて/お店から/自分のメモ）と並び替え（新しい順/古い順）を持つ。
 */
export function MaintenanceTimeline({
  records,
  token,
}: {
  records: MaintenanceRecord[]
  token: string
}) {
  const [filter, setFilter] = useState<FilterValue>('all')
  const [sort, setSort] = useState<SortValue>('newest')

  const shopCount = records.filter((r) => r.created_by === 'shop').length
  const customerCount = records.filter((r) => r.created_by === 'customer').length

  const filtered = records
    .filter((r) => filter === 'all' || r.created_by === filter)
    .sort((a, b) => {
      // 1. まず整備日 (performed_on) で比較
      const dateDiff = a.performed_on.localeCompare(b.performed_on)
      if (dateDiff !== 0) {
        return sort === 'newest' ? -dateDiff : dateDiff
      }
      // 2. 同日なら記録した時刻 (created_at) で比較
      const timeDiff = a.created_at.localeCompare(b.created_at)
      return sort === 'newest' ? -timeDiff : timeDiff
    })

  return (
    <>
      {/* フィルタ・ソートバー */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-black">
        <div className="flex flex-wrap items-center gap-1">
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            すべて ({records.length})
          </FilterChip>
          <FilterChip
            active={filter === 'shop'}
            onClick={() => setFilter('shop')}
          >
            お店から ({shopCount})
          </FilterChip>
          <FilterChip
            active={filter === 'customer'}
            onClick={() => setFilter('customer')}
          >
            自分のメモ ({customerCount})
          </FilterChip>
        </div>
        <div className="ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
            aria-label="並び替え"
          >
            <option value="newest">新しい順</option>
            <option value="oldest">古い順</option>
          </select>
        </div>
      </div>

      {/* タイムライン */}
      {filtered.length === 0 ? (
        records.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-gradient-to-br from-zinc-50 to-white p-8 text-center dark:border-zinc-700 dark:from-zinc-900 dark:to-black">
            <div className="text-5xl">🔧</div>
            <p className="mt-4 text-sm font-semibold">
              最初の整備記録を一緒に残しましょう
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              オイル交換、タイヤ交換、ちょっとした洗車メモ…<br />
              小さな1件が、未来の自分と次のオーナーへの贈り物になります。
            </p>
            <Link
              href={`/my/${token}/maintenance/new`}
              className="mt-5 inline-block rounded-full px-6 py-2.5 text-sm font-semibold"
              style={{
                background: 'var(--theme-primary)',
                color: 'var(--theme-primary-fg)',
              }}
            >
              ✏️ 最初の1件を記録する
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
            該当する記録がありません
          </div>
        )
      ) : (
        <ol className="relative space-y-4 border-l-2 border-zinc-200 pl-5 dark:border-zinc-800">
          {filtered.map((r) => {
            const isOwner = r.created_by === 'customer'
            return (
              <li key={r.id} className="relative">
                <span
                  className={`absolute -left-[27px] mt-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-black ${
                    isOwner
                      ? 'bg-blue-500 dark:bg-blue-400'
                      : 'bg-zinc-700 dark:bg-zinc-300'
                  }`}
                />
                <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isOwner
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {isOwner ? '自分のメモ' : 'お店から'}
                        </span>
                        <p className="font-semibold">{r.title}</p>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDateJP(r.performed_on)}
                        <span className="ml-2 text-zinc-400">
                          記録：{formatDateTimeJP(r.created_at)}
                        </span>
                      </p>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-2 whitespace-nowrap text-xs">
                        <Link
                          href={`/my/${token}/maintenance/${r.id}/edit`}
                          className="font-medium underline"
                        >
                          編集
                        </Link>
                        <ConfirmDeleteForm
                          action={deleteOwnerMaintenanceRecord.bind(
                            null,
                            token,
                            r.id
                          )}
                          label={`${r.title}（${formatDateJP(r.performed_on)}）`}
                          className="text-xs font-medium text-red-600 hover:underline"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                    {r.mileage_km != null && (
                      <span>{r.mileage_km.toLocaleString()} km時点</span>
                    )}
                    {r.cost != null && <span>¥{r.cost.toLocaleString()}</span>}
                  </div>
                  {r.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                      {r.description}
                    </p>
                  )}
                  {r.parts && (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-500">
                      交換部品：{r.parts}
                    </p>
                  )}
                  {/* Before / After 写真 (Phase A) */}
                  {(r.before_photo_url || r.after_photo_url) && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {r.before_photo_url && (
                        <figure className="space-y-1">
                          <figcaption className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Before（整備前）
                          </figcaption>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.before_photo_url}
                            alt="整備前"
                            className="block aspect-[4/3] w-full rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
                          />
                        </figure>
                      )}
                      {r.after_photo_url && (
                        <figure className="space-y-1">
                          <figcaption className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            After（整備後）
                          </figcaption>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.after_photo_url}
                            alt="整備後"
                            className="block aspect-[4/3] w-full rounded-md border border-zinc-200 object-cover dark:border-zinc-800"
                          />
                        </figure>
                      )}
                    </div>
                  )}
                  {r.attachment_url && (
                    <a
                      href={r.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.attachment_url}
                        alt="添付"
                        className="max-h-64 w-full rounded-md border border-zinc-200 object-contain dark:border-zinc-800"
                      />
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
      }`}
    >
      {children}
    </button>
  )
}

function formatDateJP(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${m}月${d}日`
}

/** ISO timestamp を「YYYY/MM/DD HH:mm」形式に整形 */
function formatDateTimeJP(isoStr: string): string {
  const d = new Date(isoStr)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${mo}/${da} ${hh}:${mm}`
}
