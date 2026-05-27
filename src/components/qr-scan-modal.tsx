'use client'

import { useEffect, useRef, useState } from 'react'

export type QRScanResult = {
  raw: string
  parsedFields: Record<string, string>
}

/**
 * 車検証のQRコードをカメラでスキャンするモーダル。
 *
 * 電子車検証QRの公式仕様は限定的なので、汎用的に：
 * - JSONフォーマット → そのまま展開
 * - key=value改行区切り → 展開
 * - 日付パターン抽出 → 車検満了日候補
 * - ナンバープレート風パターン抽出 → ナンバー候補
 *
 * raw データも返すので、呼び出し側でさらに解析できる。
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
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    if (!open) return
    const video = videoRef.current
    if (!video) return

    type ScannerInstance = {
      start: () => Promise<void>
      stop: () => void
      destroy: () => void
    }
    let scanner: ScannerInstance | null = null
    let cancelled = false

    ;(async () => {
      try {
        setError(null)
        setScanning(true)
        const QrScanner = (await import('qr-scanner')).default

        if (cancelled) return

        scanner = new QrScanner(
          video,
          (result: { data: string }) => {
            const parsed = parseScanned(result.data)
            onScan({ raw: result.data, parsedFields: parsed })
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment',
            maxScansPerSecond: 4,
          }
        ) as ScannerInstance

        await scanner.start()
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'カメラを起動できませんでした'
        setError(`カメラを起動できません: ${msg}（HTTPSアクセス＆カメラ権限が必要です）`)
        setScanning(false)
      }
    })()

    return () => {
      cancelled = true
      if (scanner) {
        try {
          scanner.stop()
          scanner.destroy()
        } catch {
          // ignore
        }
      }
    }
  }, [open, onScan])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-4 shadow-2xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            📸 車検証QRコードをスキャン
          </h3>
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
          {scanning && !error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                QRコードを画面中央に
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <p className="text-xs text-zinc-500">
          車検証のQRコード（券面右上）を画面に映してください。読み取った内容を確認して反映します。
        </p>
      </div>
    </div>
  )
}

/**
 * QRデータをパースして候補フィールドを抽出。
 * 取り出せた key を Record で返す。
 */
function parseScanned(raw: string): Record<string, string> {
  const fields: Record<string, string> = { _raw: raw }

  // 1. JSON フォーマットなら直接展開
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

  // 2. 改行 or カンマ区切りで key=value 形式
  const lines = raw.split(/[\r\n,]/)
  for (const line of lines) {
    const m = line.match(/^\s*([^=:]+)\s*[=:]\s*(.+?)\s*$/)
    if (m) {
      const key = m[1].trim()
      const value = m[2].trim()
      if (key.length < 50 && value.length < 200) {
        fields[key] = value
      }
    }
  }

  // 3. 日付パターン抽出（YYYY/MM/DD or YYYY-MM-DD or YYYY年MM月DD日）
  const dateMatch =
    raw.match(/(20\d{2})[/\-年](\d{1,2})[/\-月](\d{1,2})/) ||
    raw.match(/(令和)\s*(\d{1,2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (dateMatch) {
    if (dateMatch[1] === '令和') {
      // 令和xx年 → 2018+xx 年
      const y = 2018 + parseInt(dateMatch[2], 10)
      fields._date_candidate = `${y}-${dateMatch[3].padStart(2, '0')}-${dateMatch[4].padStart(2, '0')}`
    } else {
      fields._date_candidate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
    }
  }

  // 4. ナンバープレート風（地名 + 数字 + ひらがな + 数字-数字）
  const plateMatch = raw.match(
    /([一-龥]{1,5})\s*(\d{2,3})\s*([あ-ん])\s*(\d{1,4}[\s-]?\d{1,4})/
  )
  if (plateMatch) {
    fields._plate_candidate = `${plateMatch[1]} ${plateMatch[2]} ${plateMatch[3]} ${plateMatch[4]}`
  }

  // 5. 車台番号（VINや日本車の17文字英数字 or 4文字+ハイフン+数字）パターン
  const vinMatch = raw.match(/\b([A-HJ-NPR-Z0-9]{4,8}[-]?[0-9]{4,10})\b/)
  if (vinMatch) {
    fields._vin_candidate = vinMatch[1]
  }

  // 6. 初度登録年月（YYYYMM or YYYY-MM）
  const yymmMatch = raw.match(/\b(20\d{2})[\-/年]?(\d{2})月?\b/)
  if (yymmMatch && yymmMatch[0] !== dateMatch?.[0]) {
    fields._first_reg_candidate = `${yymmMatch[1]}-${yymmMatch[2]}`
  }

  return fields
}
