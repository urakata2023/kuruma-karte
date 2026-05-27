'use client'

import { useActionState, useState } from 'react'
import { processVehiclePhoto } from '@/lib/image-process'
import type { MaintenanceRecord } from '@/lib/types'

type State = { error?: string } | undefined
type ActionFn = (prev: State, formData: FormData) => Promise<State>

const TITLE_PRESETS = [
  'ガソリン給油',
  'タイヤ空気入れ',
  '洗車',
  '見積もりを受け取った',
  'お店で整備',
  'タイヤ交換',
  'オイル交換',
  '修理',
  'その他',
] as const

export function OwnerMaintenanceForm({
  action,
  record,
  submitLabel = '記録する',
  existingAttachmentUrl,
}: {
  action: ActionFn
  record?: MaintenanceRecord
  submitLabel?: string
  existingAttachmentUrl?: string | null
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [preview, setPreview] = useState<string | null>(
    existingAttachmentUrl ?? record?.attachment_url ?? null
  )
  const [processing, setProcessing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  async function handleAttachmentChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    setProcessing(true)
    setPhotoError(null)
    try {
      const processed = await processVehiclePhoto(file)
      const dt = new DataTransfer()
      dt.items.add(processed)
      e.target.files = dt.files
      setPreview(URL.createObjectURL(processed))
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('画像処理失敗:', msg, err)
      setPhotoError('写真の読み込みに失敗しました。JPEG/PNGでお試しください。')
      e.target.value = ''
    } finally {
      setProcessing(false)
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <form
      action={formAction}
      className="space-y-4"
      encType="multipart/form-data"
    >
      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium">
          メモのタイトル *
        </label>
        <input
          id="title"
          name="title"
          required
          list="owner-title-presets"
          defaultValue={record?.title ?? ''}
          placeholder="例：見積もりを受け取った、タイヤ交換"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
        <datalist id="owner-title-presets">
          {TITLE_PRESETS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="performed_on" className="block text-sm font-medium">
            日付 *
          </label>
          <input
            id="performed_on"
            name="performed_on"
            type="date"
            required
            defaultValue={record?.performed_on ?? todayStr}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="mileage_km" className="block text-sm font-medium">
            走行距離（km）
          </label>
          <input
            id="mileage_km"
            name="mileage_km"
            type="number"
            min="0"
            inputMode="numeric"
            defaultValue={record?.mileage_km ?? ''}
            placeholder="例：35000"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium">
          メモ
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={record?.description ?? ''}
          placeholder="自由にメモしてください（お店の人にも見えます）"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="cost" className="block text-sm font-medium">
          かかった金額（円）
        </label>
        <input
          id="cost"
          name="cost"
          type="number"
          min="0"
          inputMode="numeric"
          defaultValue={record?.cost ?? ''}
          placeholder="例：12000"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          写真の添付
          <span className="ml-2 text-xs font-normal text-zinc-500">
            （任意・見積もり書やレシート等）
          </span>
        </label>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="添付プレビュー"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
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
          name="attachment"
          accept="image/*,.heic,.heif"
          onChange={handleAttachmentChange}
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
