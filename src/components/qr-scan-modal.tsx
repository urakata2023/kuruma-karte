'use client'

import { useEffect, useRef, useState } from 'react'

export type QRScanResult = {
  raw: string
  parsedFields: Record<string, string>
}

/**
 * 車検証のQRコードをカメラでスキャンするモーダル。
 *
 * 車検証QRは「連結QR(Structured Append)」形式で、複数QRに分割されている。
 * かつ Shift_JIS で日本語が入っている。
 *
 * ZXing JSの BrowserQRCodeReader を使い:
 *  - Structured Append: シーケンスindex/total を読み取り、全部揃ったら連結
 *  - getRawBytes() でバイト列を取り、Shift_JIS→UTF-8 の順で decode
 */
export function QrScanModal({
  open,
  onClose,
  onScan,
}: {
  open: boolean
  onClose: () => void
  onScan: (result: QRScanResult) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>(
    'QRコードを画面中央に映してください'
  )
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null
  )

  useEffect(() => {
    if (!open) return
    const video = videoRef.current
    if (!video) return

    type Controls = { stop: () => void }
    let cancelled = false
    let controls: Controls | null = null
    let scanned = false

    // 連結QRの蓄積
    const collected = new Map<number, Uint8Array>()
    let currentParity: number | null = null
    let expectedTotal = 0

    setError(null)
    setStatus('QRコードを画面中央に映してください')
    setProgress(null)

    ;(async () => {
      try {
        const [{ BrowserQRCodeReader }, lib] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ])
        if (cancelled) return

        const hints = new Map()
        hints.set(lib.DecodeHintType.TRY_HARDER, true)
        hints.set(lib.DecodeHintType.POSSIBLE_FORMATS, [lib.BarcodeFormat.QR_CODE])

        const reader = new BrowserQRCodeReader(hints, {
          delayBetweenScanAttempts: 100,
        })

        controls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result, err) => {
            if (cancelled || scanned) return
            if (err && err.name !== 'NotFoundException') {
              // NotFoundException は「今フレームに見つからなかった」だけ
              console.debug('zxing error:', err.message)
            }
            if (!result) return

            const meta = result.getResultMetadata()
            const sequence = meta?.get(
              lib.ResultMetadataType.STRUCTURED_APPEND_SEQUENCE
            ) as number | undefined
            const parity = meta?.get(
              lib.ResultMetadataType.STRUCTURED_APPEND_PARITY
            ) as number | undefined
            const bytes = result.getRawBytes()
            if (!bytes) return

            const finalize = (merged: Uint8Array) => {
              scanned = true
              const text = decodeBytes(merged)
              onScan({ raw: text, parsedFields: parseScanned(text) })
              controls?.stop()
            }

            if (sequence !== undefined) {
              // 連結QR: 上位4ビット = index, 下位4ビット = total-1
              const index = (sequence >> 4) & 0x0f
              const total = (sequence & 0x0f) + 1

              // paritiy 変わったら新セット → reset
              if (currentParity !== null && currentParity !== parity) {
                collected.clear()
              }
              currentParity = parity ?? null
              expectedTotal = total
              collected.set(index, bytes)

              setProgress({ done: collected.size, total })

              if (collected.size >= expectedTotal) {
                // 全部揃った → 連結
                const totalLen = Array.from(collected.values()).reduce(
                  (sum, b) => sum + b.length,
                  0
                )
                const merged = new Uint8Array(totalLen)
                let offset = 0
                for (let i = 0; i < expectedTotal; i++) {
                  const part = collected.get(i)
                  if (!part) continue
                  merged.set(part, offset)
                  offset += part.length
                }
                finalize(merged)
              } else {
                setStatus(
                  `✓ ${collected.size}/${expectedTotal} 枚 読み取り完了。次のQRを映してください`
                )
              }
            } else {
              // 単一QR
              finalize(bytes)
            }
          }
        )
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'カメラを起動できませんでした'
        setError(
          `カメラを起動できません: ${msg}（HTTPSアクセス＆カメラ権限が必要です）`
        )
      }
    })()

    return () => {
      cancelled = true
      try {
        controls?.stop()
      } catch {
        // ignore
      }
    }
  }, [open, onScan])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-4 shadow-2xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">📸 車検証QRコードをスキャン</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            ✕ 閉じる
          </button>
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
          {progress && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-md bg-black/70 px-3 py-2 text-center text-xs text-white">
              連結QR: {progress.done} / {progress.total} 枚目スキャン中
            </div>
          )}
        </div>

        {error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        ) : (
          <p className="text-xs text-zinc-500">{status}</p>
        )}

        <p className="text-[10px] text-zinc-400">
          車検証下部のQRコードを順番に映してください。連結QR(複数枚)・Shift_JIS対応済み
        </p>
      </div>
    </div>
  )
}

/**
 * バイト列をテキストに復号。
 * 車検証は Shift_JIS が標準。失敗時は UTF-8 へfallback。
 */
function decodeBytes(bytes: Uint8Array): string {
  try {
    const text = new TextDecoder('shift_jis', { fatal: true }).decode(bytes)
    if (text && text.trim().length > 0) return text
  } catch {
    // try next
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    if (text && text.trim().length > 0) return text
  } catch {
    // try next
  }
  // 最後の手段：iso-8859-1（loss less）
  return new TextDecoder('iso-8859-1').decode(bytes)
}

/**
 * QRデータをパースして候補フィールドを抽出。
 */
function parseScanned(raw: string): Record<string, string> {
  const fields: Record<string, string> = { _raw: raw }

  // 1. JSON
  try {
    const json = JSON.parse(raw)
    if (typeof json === 'object' && json) {
      for (const [k, v] of Object.entries(json)) {
        if (typeof v === 'string' || typeof v === 'number') {
          fields[k] = String(v)
        }
      }
    }
  } catch {
    // not JSON
  }

  // 2. 区切り文字つき (CSV/TSV/改行)
  const lines = raw.split(/[\r\n]/)
  for (const line of lines) {
    const m = line.match(/^\s*([^=:|]+)\s*[=:|]\s*(.+?)\s*$/)
    if (m) {
      const key = m[1].trim()
      const value = m[2].trim()
      if (key.length < 50 && value.length < 200) {
        fields[key] = value
      }
    }
  }

  // 3. ナンバープレート（地名 + 数字 + ひらがな + 数字-数字）
  const plateMatch = raw.match(
    /([一-龥]{1,5})\s*(\d{2,3})\s*([あ-ん])\s*(\d{1,4}[\s-]?\d{1,4})/
  )
  if (plateMatch) {
    fields._plate_candidate = `${plateMatch[1]} ${plateMatch[2]} ${plateMatch[3]} ${plateMatch[4]}`
  }

  // 4. 日付パターン（YYYY/MM/DD, YYYY-MM-DD, YYYY年MM月DD日, 令和X年Y月Z日）
  const reiwaMatch = raw.match(
    /令和\s*(\d{1,2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})/
  )
  const heiseiMatch = raw.match(
    /平成\s*(\d{1,2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})/
  )
  const isoMatch = raw.match(/(20\d{2})[\-/年](\d{1,2})[\-/月](\d{1,2})/)

  // 車検満了日は通常「令和XX年Y月Z日」で書かれる
  if (reiwaMatch) {
    const y = 2018 + parseInt(reiwaMatch[1], 10)
    fields._date_candidate = `${y}-${reiwaMatch[2].padStart(2, '0')}-${reiwaMatch[3].padStart(2, '0')}`
  } else if (isoMatch) {
    fields._date_candidate = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`
  }

  // 5. 初度登録年月（令和X年Y月）
  const firstRegMatch =
    raw.match(/令和\s*(\d{1,2})\s*年\s*(\d{1,2})\s*月/g) ||
    raw.match(/平成\s*(\d{1,2})\s*年\s*(\d{1,2})\s*月/g)
  if (firstRegMatch && firstRegMatch.length > 0) {
    // ヒットした最初のものを初度登録候補に
    const first = firstRegMatch[0]
    const m =
      first.match(/令和\s*(\d{1,2})\s*年\s*(\d{1,2})/) ||
      first.match(/平成\s*(\d{1,2})\s*年\s*(\d{1,2})/)
    if (m) {
      const era = first.startsWith('令和') ? 2018 : 1988
      const y = era + parseInt(m[1], 10)
      fields._first_reg_candidate = `${y}-${m[2].padStart(2, '0')}`
    }
  }

  // 6. 車台番号（英数字 + ハイフン + 数字）
  const vinMatch = raw.match(/\b([A-HJ-NPR-Z0-9]{4,8}[-][0-9]{4,10})\b/)
  if (vinMatch) {
    fields._vin_candidate = vinMatch[1]
  }
  // 平成は使われない可能性が高いが、平成派生の年号変換
  void heiseiMatch

  return fields
}
