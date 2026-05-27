'use client'

import { useActionState, useState } from 'react'
import { processVehiclePhoto } from '@/lib/image-process'
import type { Vehicle } from '@/lib/types'

type State = { error?: string } | undefined
type ActionFn = (prev: State, formData: FormData) => Promise<State>

export function VehicleForm({
  action,
  vehicle,
  submitLabel = '保存する',
}: {
  action: ActionFn
  vehicle?: Vehicle
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [preview, setPreview] = useState<string | null>(
    vehicle?.photo_url ?? null
  )
  const [previewable, setPreviewable] = useState(!!vehicle?.photo_url)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

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
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('画像処理失敗:', msg, err)
      setPhotoError(
        '写真の読み込みに失敗しました。JPEG/PNG でお試しください。'
      )
      e.target.value = ''
      setSelectedFileName(null)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          愛車の写真
          <span className="ml-2 text-xs font-normal text-zinc-500">（任意）</span>
        </label>

        {/* 大きなプレビュー */}
        <div className="relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          {previewable && preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="愛車プレビュー"
              className="block max-h-[60vh] w-full object-contain"
            />
          ) : selectedFileName ? (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="text-4xl">📎</div>
              <p className="text-sm font-medium">{selectedFileName}</p>
              <p className="text-xs text-zinc-500">
                iPhone写真（HEIC）はブラウザで直接プレビューできません
                <br />
                保存時にサーバーでJPEGに変換されます
              </p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/default-vehicle.svg"
              alt="愛車（写真未登録）"
              className="block aspect-[4/3] w-full object-cover"
            />
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
        {photoError ? (
          <p className="text-xs text-red-600 dark:text-red-400">{photoError}</p>
        ) : (
          <p className="text-xs text-zinc-500">
            iPhone(HEIC) も自動で JPEG に変換・1MB以下に圧縮されます
          </p>
        )}
      </div>

      <Field
        name="model"
        label="車種"
        defaultValue={vehicle?.model ?? ''}
        placeholder="例：ハイエース ワイドミドル"
      />
      <Field
        name="plate_number"
        label="ナンバー"
        defaultValue={vehicle?.plate_number ?? ''}
        placeholder="例:品川 300 あ 12-34"
      />
      <Field
        name="first_registration_ym"
        label="初度登録年月"
        defaultValue={vehicle?.first_registration_ym ?? ''}
        placeholder="例:2021-04"
      />
      <Field
        name="inspection_expires_on"
        label="車検満了日 ★"
        type="date"
        defaultValue={vehicle?.inspection_expires_on ?? ''}
        hint="ここが入っていると、車検3ヶ月前から自動通知の対象になります"
      />
      <Field
        name="purchased_on"
        label="購入日"
        type="date"
        defaultValue={vehicle?.purchased_on ?? ''}
      />
      <Field
        name="last_oil_change_on"
        label="前回オイル交換日"
        type="date"
        defaultValue={vehicle?.last_oil_change_on ?? ''}
      />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || processing}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? '保存中…' : submitLabel}
      </button>
    </form>
  )
}

function Field({
  name,
  label,
  type = 'text',
  defaultValue,
  placeholder,
  hint,
}: {
  name: string
  label: string
  type?: string
  defaultValue?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
      />
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}
