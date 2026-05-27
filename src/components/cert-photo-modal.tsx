'use client'

import { useRef, useState } from 'react'
import { processVehiclePhoto } from '@/lib/image-process'

/**
 * OCR API レスポンス (server-side で抽出された生データ)
 */
type CertOcrApiResult = {
  model: string | null
  plate_number: string | null
  inspection_expires_on: string | null
  first_registration_ym: string | null
  registration_date: string | null
  vin: string | null
  usage: 'private_passenger' | 'private_cargo' | 'commercial' | null
  is_electronic_cert: boolean
  notes: string | null
}

/**
 * フォーム側に渡す最終データ (推定値計算済み)。
 * inspection_expires_on_estimated: true なら、車検満了日が「推定値」であることを示す
 * (電子車検証で紙に印字されておらず、登録年月日+用途別有効期間から計算したケース)。
 */
export type CertOcrFields = {
  model: string | null
  plate_number: string | null
  inspection_expires_on: string | null
  inspection_expires_on_estimated: boolean
  first_registration_ym: string | null
  vin: string | null
  is_electronic_cert: boolean
  notes: string | null
}

/**
 * 車検証の写真を撮影/選択 → サーバーで OCR (Claude Vision) → 結果を返すモーダル。
 *
 * 電子車検証 (A6サイズ、2023年〜) は満了日が紙にないため、検出時には
 * 「別紙の自動車検査証記録事項を撮るか/推定値で進むか」の選択肢を提示する。
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
    'idle' | 'compressing' | 'uploading' | 'electronic_review' | 'done' | 'error'
  >('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [readyFile, setReadyFile] = useState<File | null>(null)
  const [electronicResult, setElectronicResult] =
    useState<CertOcrApiResult | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setStage('compressing')
    setErrorMsg(null)
    setSelectedName(file.name)
    setElectronicResult(null)
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
      const data = (await res.json()) as {
        ok: boolean
        result?: CertOcrApiResult
        error?: string
      }
      if (!data.ok || !data.result) throw new Error(data.error ?? '不明なエラー')

      const result = data.result

      // 電子車検証 & 満了日が読み取れていない → ユーザに選ばせるステップに入る
      if (result.is_electronic_cert && !result.inspection_expires_on) {
        setElectronicResult(result)
        setStage('electronic_review')
        return
      }

      // 通常ケース: そのまま反映
      setStage('done')
      onComplete(toFields(result, false))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(`読み取り失敗: ${msg}`)
      setStage('error')
    }
  }

  /** 電子車検証の推定値モードで完了 */
  function proceedWithEstimate() {
    if (!electronicResult) return
    const estimated = estimateExpiration(electronicResult)
    const fields: CertOcrFields = {
      ...toFields(electronicResult, false),
      inspection_expires_on: estimated,
      inspection_expires_on_estimated: estimated !== null,
    }
    setStage('done')
    onComplete(fields)
  }

  /** 電子車検証で「満了日は手入力する」を選択 */
  function proceedWithoutExpiration() {
    if (!electronicResult) return
    const fields: CertOcrFields = {
      ...toFields(electronicResult, false),
      inspection_expires_on: null,
      inspection_expires_on_estimated: false,
    }
    setStage('done')
    onComplete(fields)
  }

  /** 別の写真 (記録事項の別紙 A4) を撮り直す */
  function retryPhoto() {
    setElectronicResult(null)
    setReadyFile(null)
    setPreview(null)
    setPreviewable(false)
    setSelectedName(null)
    setStage('idle')
    if (fileRef.current) fileRef.current.value = ''
    fileRef.current?.click()
  }

  function reset() {
    setPreview(null)
    setPreviewable(false)
    setSelectedName(null)
    setReadyFile(null)
    setErrorMsg(null)
    setElectronicResult(null)
    setStage('idle')
    if (fileRef.current) fileRef.current.value = ''
  }

  if (!open) return null

  const busy = stage === 'compressing' || stage === 'uploading'
  const reviewing = stage === 'electronic_review'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl bg-white p-4 shadow-2xl dark:bg-zinc-900">
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

        {reviewing && electronicResult ? (
          <ElectronicCertReview
            result={electronicResult}
            estimated={estimateExpiration(electronicResult)}
            onUseEstimate={proceedWithEstimate}
            onManual={proceedWithoutExpiration}
            onRetry={retryPhoto}
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

/**
 * 電子車検証検出時のレビュー画面。
 * - 推定満了日を計算して表示
 * - 「推定値で進む」「別紙を撮り直す」「手入力する」の3択
 */
function ElectronicCertReview({
  result,
  estimated,
  onUseEstimate,
  onManual,
  onRetry,
}: {
  result: CertOcrApiResult
  estimated: string | null
  onUseEstimate: () => void
  onManual: () => void
  onRetry: () => void
}) {
  const isNew = isNewCar(result)

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        <p className="mb-2 font-semibold">📋 電子車検証 (A6サイズ) を検出しました</p>
        <p>
          電子車検証の有効期限は ICチップ内に格納されており、紙には印字されていません。
          別紙の <b>「自動車検査証記録事項」(A4)</b> または{' '}
          <b>国交省「車検証閲覧アプリ」の画面</b>{' '}
          に満了日が記載されています。
        </p>
      </div>

      <div className="space-y-1 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">読み取れた項目</p>
        <ul className="space-y-0.5 text-zinc-600 dark:text-zinc-400">
          {result.model && <li>車種: {result.model}</li>}
          {result.plate_number && <li>ナンバー: {result.plate_number}</li>}
          {result.first_registration_ym && (
            <li>初度登録: {result.first_registration_ym}</li>
          )}
          {result.registration_date && (
            <li>登録年月日: {result.registration_date}</li>
          )}
          {result.vin && <li>車台番号: {result.vin}</li>}
        </ul>
      </div>

      {estimated && (
        <div className="space-y-1 rounded-md border border-blue-300 bg-blue-50 p-3 text-xs dark:border-blue-700 dark:bg-blue-950">
          <p className="font-medium text-blue-900 dark:text-blue-200">
            推定 車検満了日: <span className="text-base font-bold">{estimated}</span>
          </p>
          <p className="text-blue-800 dark:text-blue-300">
            ({isNew ? '新車・初回車検 (3年)' : '継続車検 (2年)'} として計算)
            <br />
            ※ あくまで推定値。お客様にご確認ください
          </p>
        </div>
      )}

      <div className="space-y-2">
        {estimated && (
          <button
            type="button"
            onClick={onUseEstimate}
            className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            推定値で進む（あとで修正可能）
          </button>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          別紙「記録事項」を撮り直す
        </button>
        <button
          type="button"
          onClick={onManual}
          className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          満了日は手入力する
        </button>
      </div>
    </div>
  )
}

/**
 * 新車かどうか判定: 初度登録年月と登録年月日の「年月」が一致 = この車検証が新車登録時に発行された
 */
function isNewCar(r: CertOcrApiResult): boolean {
  if (!r.first_registration_ym || !r.registration_date) return false
  const regYm = r.registration_date.slice(0, 7) // YYYY-MM
  return regYm === r.first_registration_ym
}

/**
 * 車検満了日を推定する。
 * 自家用乗用: 新車=3年, 継続=2年
 * 自家用貨物: 2年
 * 事業用: 1年 (推定値の信頼性が低いので null を返す)
 */
function estimateExpiration(r: CertOcrApiResult): string | null {
  if (!r.registration_date) return null

  let years = 2 // デフォルト: 自家用乗用の継続車検
  if (r.usage === 'private_passenger' || r.usage === null) {
    years = isNewCar(r) ? 3 : 2
  } else if (r.usage === 'private_cargo') {
    years = 2
  } else if (r.usage === 'commercial') {
    // 事業用は1年が基本だが信頼性低いので推定値は出さない
    return null
  }

  return addYears(r.registration_date, years)
}

function addYears(yyyymmdd: string, years: number): string {
  const m = yyyymmdd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return yyyymmdd
  const y = parseInt(m[1], 10) + years
  return `${y}-${m[2]}-${m[3]}`
}

function toFields(r: CertOcrApiResult, estimated: boolean): CertOcrFields {
  return {
    model: r.model,
    plate_number: r.plate_number,
    inspection_expires_on: r.inspection_expires_on,
    inspection_expires_on_estimated: estimated,
    first_registration_ym: r.first_registration_ym,
    vin: r.vin,
    is_electronic_cert: r.is_electronic_cert,
    notes: r.notes,
  }
}
