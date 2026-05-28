/**
 * 日時フォーマッター (Asia/Tokyo 固定)
 *
 * Vercel/Supabase 等のサーバーは UTC で動いているため、
 * new Date().getHours() などはそのまま使うとUTC基準になってしまう。
 * Intl.DateTimeFormat で timeZone: 'Asia/Tokyo' を指定して、
 * 必ず JST で表示する。
 */

const JST_TIME = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const JST_DATE_FULL = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const JST_DATETIME = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** ISO文字列 → "22:50" (JST) */
export function formatTimeJST(iso: string | Date): string {
  return JST_TIME.format(typeof iso === 'string' ? new Date(iso) : iso)
}

/** ISO文字列 → "2026年5月29日" (JST) */
export function formatDateJST(iso: string | Date): string {
  return JST_DATE_FULL.format(typeof iso === 'string' ? new Date(iso) : iso)
}

/** ISO文字列 → "2026/05/29 22:50" (JST) */
export function formatDateTimeJST(iso: string | Date): string {
  return JST_DATETIME.format(typeof iso === 'string' ? new Date(iso) : iso)
}

/** YYYY-MM-DD → "今日 / 昨日 / 2026年5月29日" (JST基準で比較) */
export function formatDayLabelJST(yyyymmdd: string): string {
  // JST の今日と比較
  const now = new Date()
  const jstToday = JST_DATE_FULL.format(now)
  const jstYesterday = JST_DATE_FULL.format(
    new Date(now.getTime() - 24 * 3600 * 1000)
  )
  const target = JST_DATE_FULL.format(new Date(yyyymmdd + 'T12:00:00Z')) // 正午基準で日付ズレ防止
  if (target === jstToday) return '今日'
  if (target === jstYesterday) return '昨日'
  return target
}

/**
 * JST基準の YYYY-MM-DD を取得 (グルーピング用)
 */
export function jstDateKey(iso: string): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}
