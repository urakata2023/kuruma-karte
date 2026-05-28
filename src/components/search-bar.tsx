'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CustomerTagBadges } from '@/components/customer-tag-badges'

type CustomerHit = {
  id: string
  name: string
  phone: string | null
  email: string | null
  tags: string[]
}

type VehicleHit = {
  id: string
  model: string | null
  plate_number: string | null
  inspection_expires_on: string | null
  customer_id: string
  customer_name: string
}

type SearchResult = {
  customers: CustomerHit[]
  vehicles: VehicleHit[]
}

/**
 * インクリメンタル検索バー (Phase L+ / Spotlight風)
 *
 * - 入力中にデバウンスして /api/search を叩く
 * - 顧客と車両の結果をドロップダウンで表示
 * - Enter で /search ページに遷移 (全結果)
 * - 結果クリックで該当ページへ
 * - Esc で閉じる
 */
export function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult>({
    customers: [],
    vehicles: [],
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // デバウンス検索
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResult({ customers: [], vehicles: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        if (!res.ok) throw new Error('search failed')
        const data = (await res.json()) as SearchResult
        setResult(data)
      } catch {
        setResult({ customers: [], vehicles: [] })
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setOpen(false)
    }
  }

  const totalHits = result.customers.length + result.vehicles.length
  const showDropdown = open && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false)
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            placeholder="名前・電話・ナンバー・車種で検索…"
            className="w-full rounded-lg border bg-transparent py-2 pl-10 pr-3 text-sm placeholder-zinc-400 focus:outline-none"
            style={{
              borderColor: 'var(--hairline)',
              color: 'var(--ink)',
            }}
          />
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: 'var(--ink-subtle)' }}
          >
            🔍
          </span>
          {loading && (
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: 'var(--ink-subtle)' }}
            >
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </span>
          )}
        </div>
      </form>

      {/* ドロップダウン結果 */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border shadow-2xl"
          style={{
            background: 'var(--surface-1)',
            borderColor: 'var(--hairline)',
          }}
        >
          {totalHits === 0 && !loading ? (
            <div
              className="px-4 py-6 text-center text-sm"
              style={{ color: 'var(--ink-subtle)' }}
            >
              「{query}」 に一致するお客様・車両が見つかりません
            </div>
          ) : (
            <>
              {result.customers.length > 0 && (
                <div>
                  <p
                    className="text-eyebrow border-b px-4 py-2"
                    style={{
                      color: 'var(--ink-tertiary)',
                      borderColor: 'var(--hairline)',
                    }}
                  >
                    👥 お客さん ({result.customers.length})
                  </p>
                  <ul>
                    {result.customers.map((c) => (
                      <li
                        key={c.id}
                        style={{
                          borderTop: '1px solid var(--hairline)',
                        }}
                        className="first:border-t-0"
                      >
                        <Link
                          href={`/customers/${c.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-start justify-between gap-3 px-4 py-3 transition-colors"
                          style={{ color: 'var(--ink)' }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{c.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p
                                className="text-xs tabular-figs"
                                style={{ color: 'var(--ink-subtle)' }}
                              >
                                {c.phone || c.email || '連絡先未登録'}
                              </p>
                              <CustomerTagBadges tags={c.tags} />
                            </div>
                          </div>
                          <span
                            className="text-xs"
                            style={{ color: 'var(--ink-tertiary)' }}
                          >
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.vehicles.length > 0 && (
                <div
                  style={{
                    borderTop:
                      result.customers.length > 0
                        ? '6px solid var(--surface-2)'
                        : '0',
                  }}
                >
                  <p
                    className="text-eyebrow border-b px-4 py-2"
                    style={{
                      color: 'var(--ink-tertiary)',
                      borderColor: 'var(--hairline)',
                    }}
                  >
                    🚗 車両 ({result.vehicles.length})
                  </p>
                  <ul>
                    {result.vehicles.map((v) => (
                      <li
                        key={v.id}
                        style={{
                          borderTop: '1px solid var(--hairline)',
                        }}
                        className="first:border-t-0"
                      >
                        <Link
                          href={`/vehicles/${v.id}`}
                          onClick={() => setOpen(false)}
                          className="flex items-start justify-between gap-3 px-4 py-3 transition-colors"
                          style={{ color: 'var(--ink)' }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">
                              {v.model ?? '車種未登録'}
                              {v.plate_number && (
                                <span
                                  className="ml-2 text-xs font-normal"
                                  style={{ color: 'var(--ink-subtle)' }}
                                >
                                  {v.plate_number}
                                </span>
                              )}
                            </p>
                            <p
                              className="mt-0.5 text-xs"
                              style={{ color: 'var(--ink-subtle)' }}
                            >
                              {v.customer_name} 様
                              {v.inspection_expires_on && (
                                <span className="ml-2 tabular-figs">
                                  · 車検 {v.inspection_expires_on}
                                </span>
                              )}
                            </p>
                          </div>
                          <span
                            className="text-xs"
                            style={{ color: 'var(--ink-tertiary)' }}
                          >
                            →
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 全結果ページへのリンク */}
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setOpen(false)}
                className="block border-t px-4 py-2.5 text-center text-xs font-medium transition-colors"
                style={{
                  borderColor: 'var(--hairline)',
                  background: 'var(--surface-2)',
                  color: 'var(--ink-muted)',
                }}
              >
                すべての検索結果を見る (Enter) →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
