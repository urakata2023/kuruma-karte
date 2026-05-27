'use client'

import { useRef, useState } from 'react'
import { processVehiclePhoto } from '@/lib/image-process'

export type CertOcrFields = {
  model: string | null
  plate_number: string | null
  inspection_expires_on: string | null
  first_registration_ym: string | null
  vin: string | null
  notes: string | null
}

/**
 * 車検証の写真を撮影/選択 → サーバーで OCR (Claude Vision) → 結果を返すモーダル。
 */
export function CertPhotoModal({
  open,
  onClose,
  onComplete,
}: {
  open: boolean
  onClose: () => void
  onComplete: (fields: CertOcrFields) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewable, setPreviewable] = useState(false)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [stage, setStage] = useState<
    'idle' | 'compressing' | 'uploading' | 'done' | 'error'
  >('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [readyFile, setReadyFile] = useState<File | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStage('compressing')
    setErrorMsg(null)
    setSelectedName(file.name)
    try {
      const processed = await processVehiclePhoto(file)
      setReadyFile(processed)
      if (/image\/(jpe?g|png|webp)/i.test(processed.type)) {
        setPreview(URL.createObjectURL(processed))
        setPreviewable(true)
      } else {
        setPreview(null)
        setPreviewable(false)
      }
      setStage('idle')
    } catch (err) {
      console.error('画像処理失敗:', err)
      setErrorMsg('画像の読み込みに失敗しました。JPEG/PNGでお試しください。')
      setStage('error')
    }
  }

  async function handleScan() {
    if (!readyFile) {
      setErrorMsg('先に写真を選択してください')
      return
    }
    setStage('uploading')
    setErrorMsg(null)
    try {
      const fd = new FormData()
      fd.append('image', readyFile)
      const res = await fetch('/api/cert-scan', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `読み取りに失敗 (HTTP ${res.status})`)
      }
      const data = (await res.json()) as { ok: boolean; result?: CertOcrFields; error?: string }
      if (!data.ok || !data.result) throw new Error(data.error ?? '不明なエラー')

      setStage('done')
      onComplete(data.result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(`読み取り失敗: ${msg}`)
      setStage('error')
    }
  }

  function reset() {
    setPreview(null)
    setPreviewable(false)
    setSelectedName(null)
    setReadyFile(null)
    setErrorMsg(null)
    setStage('idle')
    if (fileRef.current) fileRef.current.value = ''
  }

  if (!open) return null

  const busy = stage === 'compressing' || stage === 'uploading'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-4 shadow-2xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            📸 車検証の写真で自動入力
          </h3>
          <button
            type="button"
            onClick={() => {
              reset()
              onClose()
            }}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            ✕ 閉じる
          </button>
        </div>

        <div className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:bg-blue-950 dark:text-blue-200">
          車検証全体が映るように撮影してください。AIが自動でナンバー・車検満了日・初度登録・車種を読み取ります。
        </div>

        {/* プレビュー */}
        <div className="relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          {previewable && preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="車検証プレビュー"
              className="block max-h-[50vh] w-full object-contain"
            />
          ) : selectedName ? (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 p-6 text-center">
              <div className="text-4xl">📎</div>
              <p className="text-sm font-medium">{selectedName}</p>
              <p className="text-xs text-zinc-500">
                HEIC等はサーバーでJPEGに変換されます
              </p>
            </div>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 p-6 text-center text-zinc-400">
              <div className="text-5xl">📄</div>
              <p className="text-sm">下のボタンから車検証の写真を選択</p>
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <p className="text-xs">
                {stage === 'compressing'
                  ? '画像を準備中…'
                  : 'AIが解析中…（数秒〜30秒）'}
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,.heic,.heif"
          capture="environment"
          onChange={handleChange}
          disabled={busy}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:opacity-50 dark:file:bg-white dark:file:text-black"
        />

        {errorMsg && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
            {errorMsg}
          </p>
        )}

        <button
          type="button"
          onClick={handleScan}
          disabled={!readyFile || busy}
          className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {stage === 'uploading'
            ? 'AIが解析中…'
            : stage === 'done'
              ? '✓ 完了'
              : '🪄 この写真で読み取る'}
        </button>

        <p className="text-center text-[10px] text-zinc-400">
          画像はサーバーで JPEG 化＆リサイズしてから AI に送ります
        </p>
      </div>
    </div>
  )
}
