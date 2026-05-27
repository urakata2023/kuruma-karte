'use client'

import { useEffect, useRef, useState } from 'react'

export type QRScanResult = {
  raw: string
  parsedFields: Record<string, string>
}

/**
 * 車検証のQRコードをカメラでスキャンするモーダル。
 *
 * 車検証QRは「連結QR(Structured Append)」形式 (通常4枚に分割) + Shift_JIS。
 * - ZXing JS で読み取り
 * - 4つのQRを順次スキャン → 自動連結
 * - 視覚的なステップ表示で「次にどのQRを映すか」を明示
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
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(4) // 車検証は通常4枚

  useEffect(() => {
    if (!open) return
    const video = videoRef.current
    if (!video) return

    type Controls = { stop: () => void }
    let cancelled = false
    let controls: Controls | null = null
    let scanned = false

    const collected = new Map<number, Uint8Array>()
    let currentParity: number | null = null
    let expectedTotal = 0

    setError(null)
    setDone(0)
    setTotal(4)

    ;(async () => {
      try {
        const [{ BrowserQRCodeReader }, lib] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ])
        if (cancelled) return

        const hints = new Map()
        hints.set(lib.DecodeHintType.TRY_HARDER, true)
        hints.set(lib.DecodeHintType.POSSIBLE_FORMATS, [
          lib.BarcodeFormat.QR_CODE,
        ])

        const reader = new BrowserQRCodeReader(hints, {
          delayBetweenScanAttempts: 100,
        })

        controls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result, err) => {
            if (cancelled || scanned) return
            if (err && err.name !== 'NotFoundException') {
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
              const index = (sequence >> 4) & 0x0f
              const totalCount = (sequence & 0x0f) + 1

              if (currentParity !== null && currentParity !== parity) {
                collected.clear()
              }
              currentParity = parity ?? null
              expectedTotal = totalCount

              const isNew = !collected.has(index)
              collected.set(index, bytes)

              setTotal(totalCount)
              setDone(collected.size)

              // 振動フィードバック（成功時）
              if (isNew && 'vibrate' in navigator) {
                navigator.vibrate?.(100)
              }

              if (collected.size >= expectedTotal) {
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
              }
            } else {
              // 単一QR
              if ('vibrate' in navigator) navigator.vibrate?.(100)
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

  const nextStep = done + 1
  const isComplete = done >= total

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

        {/* 車検証の視覚的ガイド */}
        <CertGuide done={done} total={total} />

        {/* メイン指示文 */}
        {!error && (
          <div className="rounded-md bg-blue-50 px-3 py-2 text-center text-sm font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200">
            {done === 0 ? (
              <>
                車検証の <span className="font-bold">下部</span> にあるQRコードを
                <br />
                <span className="font-bold text-base">左から順に1つずつ</span> カメラに映してください
              </>
            ) : isComplete ? (
              <>✓ 全部読み込み完了！自動入力します...</>
            ) : (
              <>
                ✓ {done}枚目スキャン完了
                <br />
                <span className="font-bold text-base">
                  次は左から{nextStep}番目のQR
                </span>{' '}
                を映してください
              </>
            )}
          </div>
        )}

        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />
          {/* スキャン中アニメーション */}
          {!isComplete && !error && (
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
              <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">
                スキャン中…
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <p className="text-center text-[10px] text-zinc-400">
          黄色の枠にQRを合わせると自動でスキャンされます
        </p>
      </div>
    </div>
  )
}

/**
 * 車検証の下部QRエリアを模した視覚ガイド。
 * 読み取り済みのQRは緑チェック、次に読むQRは点滅。
 */
function CertGuide({ done, total }: { done: number; total: number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-2 text-center text-[10px] text-zinc-500">
        車検証（下部のQR配置イメージ）
      </p>
      <div className="mx-auto flex max-w-xs justify-between gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const scanned = i < done
          const current = i === done
          return (
            <div
              key={i}
              className={`flex flex-1 flex-col items-center gap-1 ${
                current ? 'animate-pulse' : ''
              }`}
            >
              <div
                className={`flex aspect-square w-full items-center justify-center rounded border-2 text-base font-bold ${
                  scanned
                    ? 'border-green-500 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                    : current
                      ? 'border-blue-500 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'border-zinc-300 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950'
                }`}
              >
                {scanned ? '✓' : current ? '◉' : i + 1}
              </div>
              <p
                className={`text-[9px] font-medium ${
                  scanned
                    ? 'text-green-700 dark:text-green-300'
                    : current
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-zinc-400'
                }`}
              >
                {scanned ? '読込済' : current ? '次これ' : `${i + 1}枚目`}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
  return new TextDecoder('iso-8859-1').decode(bytes)
}

function parseScanned(raw: string): Record<string, string> {
  const fields: Record<string, string> = { _raw: raw }

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

  const plateMatch = raw.match(
    /([一-龥]{1,5})\s*(\d{2,3})\s*([あ-ん])\s*(\d{1,4}[\s-]?\d{1,4})/
  )
  if (plateMatch) {
    fields._plate_candidate = `${plateMatch[1]} ${plateMatch[2]} ${plateMatch[3]} ${plateMatch[4]}`
  }

  const reiwaMatch = raw.match(
    /令和\s*(\d{1,2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})/
  )
  const isoMatch = raw.match(/(20\d{2})[\-/年](\d{1,2})[\-/月](\d{1,2})/)

  if (reiwaMatch) {
    const y = 2018 + parseInt(reiwaMatch[1], 10)
    fields._date_candidate = `${y}-${reiwaMatch[2].padStart(2, '0')}-${reiwaMatch[3].padStart(2, '0')}`
  } else if (isoMatch) {
    fields._date_candidate = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`
  }

  const firstRegMatch = raw.match(/令和\s*(\d{1,2})\s*年\s*(\d{1,2})\s*月/g)
  if (firstRegMatch && firstRegMatch.length > 0) {
    const first = firstRegMatch[0]
    const m = first.match(/令和\s*(\d{1,2})\s*年\s*(\d{1,2})/)
    if (m) {
      const y = 2018 + parseInt(m[1], 10)
      fields._first_reg_candidate = `${y}-${m[2].padStart(2, '0')}`
    }
  }

  const vinMatch = raw.match(/\b([A-HJ-NPR-Z0-9]{4,8}[-][0-9]{4,10})\b/)
  if (vinMatch) {
    fields._vin_candidate = vinMatch[1]
  }

  return fields
}
