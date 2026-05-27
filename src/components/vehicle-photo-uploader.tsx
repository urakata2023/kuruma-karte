'use client'

import { useActionState, useState } from 'react'
import { processVehiclePhoto } from '@/lib/image-process'

type State = { error?: string } | undefined
type ActionFn = (prev: State, formData: FormData) => Promise<State>

/**
 * 車屋ダッシュボードの車両詳細ページで使う、ギャラリーへ写真を追加するフォーム。
 */
export function VehiclePhotoUploader({ action }: { action: ActionFn }) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewable, setPreviewable] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessing(true)
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
      console.warn('画像処理失敗:', err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
      <p className="text-sm font-medium">＋ ギャラリーに写真を追加</p>
      <input
        type="file"
        name="photo"
        accept="image/*,.heic,.heif"
        onChange={handleChange}
        disabled={processing}
        required
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:opacity-50 dark:file:bg-white dark:file:text-black"
      />
      {previewable && preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="プレビュー"
          className="block max-h-48 rounded-md border border-zinc-200 dark:border-zinc-800"
        />
      )}
      {!previewable && selectedFileName && (
        <p className="text-xs text-zinc-500">
          📎 {selectedFileName}（サーバー側でJPEGに変換されます）
        </p>
      )}
      <input
        type="text"
        name="caption"
        placeholder="キャプション（任意・例：カスタム後、洗車直後など）"
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
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
        {pending ? 'アップロード中…' : '写真を追加する'}
      </button>
    </form>
  )
}
