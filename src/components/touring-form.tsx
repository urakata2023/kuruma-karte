'use client'

import { useActionState, useRef, useState } from 'react'
import { processVehiclePhoto } from '@/lib/image-process'
import type { TouringRecord } from '@/lib/types'

type State = { error?: string } | undefined
type ActionFn = (prev: State, formData: FormData) => Promise<State>

export function TouringForm({
  action,
  record,
  submitLabel = '記録する',
}: {
  action: ActionFn
  record?: TouringRecord
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [preview, setPreview] = useState<string | null>(
    record?.photo_url ?? null
  )
  const [previewable, setPreviewable] = useState(!!record?.photo_url)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [geoStatus, setGeoStatus] = useState<string | null>(null)
  const latRef = useRef<HTMLInputElement>(null)
  const lngRef = useRef<HTMLInputElement>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    record?.latitude != null && record?.longitude != null
      ? { lat: record.latitude, lng: record.longitude }
      : null
  )

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessing(true)
    setPhotoError(null)
    setSelectedFileName(file.name)
    try {
      const processed = await processVehiclePhoto(file)
      const dt = new DataTransfer()
      dt.items.add(processed)
      e.target.files = dt.files
      if (/image\/(jpe?g|png|webp)/i.test(processed.type)) {
        setPreview(URL.createObjectURL(processed))
        setPreviewable(true)
      } else {
        setPreview(null)
        setPreviewable(false)
      }
    } catch (err) {
      console.error('画像処理失敗:', err)
      setPhotoError('写真の読み込みに失敗しました')
      e.target.value = ''
    } finally {
      setProcessing(false)
    }
  }

  function handleGetLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('お使いのブラウザは現在地取得に対応していません')
      return
    }
    setGeoStatus('現在地を取得中…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        if (latRef.current) latRef.current.value = String(lat)
        if (lngRef.current) lngRef.current.value = String(lng)
        setCoords({ lat, lng })
        setGeoStatus(`✓ 取得しました（${lat.toFixed(5)}, ${lng.toFixed(5)}）`)
      },
      (err) => {
        setGeoStatus(`取得失敗: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium">
          タイトル *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={record?.title ?? ''}
          placeholder="例：箱根ツーリング、伊豆ドライブ"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="touring_date" className="block text-sm font-medium">
          日付 *
        </label>
        <input
          id="touring_date"
          name="touring_date"
          type="date"
          required
          defaultValue={record?.touring_date ?? todayStr}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="place_name" className="block text-sm font-medium">
          場所の名前
        </label>
        <input
          id="place_name"
          name="place_name"
          defaultValue={record?.place_name ?? ''}
          placeholder="例：芦ノ湖、伊豆スカイライン"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="address" className="block text-sm font-medium">
          住所
          <span className="ml-2 text-xs font-normal text-zinc-500">
            （任意・分かる範囲で）
          </span>
        </label>
        <input
          id="address"
          name="address"
          defaultValue={record?.address ?? ''}
          placeholder="例：神奈川県箱根町元箱根"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      {/* 現在地取得 */}
      <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block text-sm font-medium">
          🗺️ 現在地を地図用に記録
        </label>
        <button
          type="button"
          onClick={handleGetLocation}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-800"
        >
          📍 現在地を取得
        </button>
        {geoStatus && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{geoStatus}</p>
        )}
        {coords && !geoStatus && (
          <p className="text-xs text-zinc-500">
            登録済み座標：{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}
        <input
          type="hidden"
          name="latitude"
          ref={latRef}
          defaultValue={record?.latitude ?? ''}
        />
        <input
          type="hidden"
          name="longitude"
          ref={lngRef}
          defaultValue={record?.longitude ?? ''}
        />
        <p className="text-[10px] text-zinc-500">
          ※ 地図上のピン表示は今後のアップデートで対応します
        </p>
      </div>

      <div className="space-y-1">
        <label htmlFor="memo" className="block text-sm font-medium">
          メモ・思い出
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={3}
          defaultValue={record?.memo ?? ''}
          placeholder="どんなツーリングだった？同行者、天気、感想など"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          写真
          <span className="ml-2 text-xs font-normal text-zinc-500">
            （任意・1枚）
          </span>
        </label>
        <div className="relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          {previewable && preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="プレビュー"
              className="block max-h-[50vh] w-full object-contain"
            />
          ) : selectedFileName ? (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 p-6 text-center">
              <div className="text-4xl">📎</div>
              <p className="text-sm font-medium">{selectedFileName}</p>
              <p className="text-xs text-zinc-500">
                サーバーでJPEGに変換されます
              </p>
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-sm text-zinc-400">
              プレビュー
            </div>
          )}
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
              画像を準備中…
            </div>
          )}
        </div>
        <input
          type="file"
          name="photo"
          accept="image/*,.heic,.heif"
          onChange={handlePhotoChange}
          disabled={processing}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:opacity-50 dark:file:bg-white dark:file:text-black"
        />
        {photoError && (
          <p className="text-xs text-red-600 dark:text-red-400">{photoError}</p>
        )}
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || processing}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? '保存中…' : submitLabel}
      </button>
    </form>
  )
}
